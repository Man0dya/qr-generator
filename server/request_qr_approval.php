<?php
require 'db.php';
require 'utils.php';

function column_exists(PDO $conn, string $table, string $column): bool
{
    try {
        $stmt = $conn->prepare(
            "SELECT 1
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c
             LIMIT 1"
        );
        $stmt->execute([':t' => $table, ':c' => $column]);
        return $stmt->fetchColumn() !== false;
    } catch (Exception $e) {
        return false;
    }
}

$input = json_decode(file_get_contents("php://input"), true);

$user = require_auth();
$user_id = $user['id'];

$qr_id = isset($input['qr_id']) ? (int) $input['qr_id'] : 0;
$note = isset($input['note']) ? trim((string) $input['note']) : null;

if ($qr_id <= 0) {
    json_response(["error" => "Missing qr_id"], 400);
    exit();
}

try {
    if (!column_exists($conn, 'qr_codes', 'approval_request_status')) {
        json_response([
            "error" => "Approval requests are not enabled in the database yet. Run migration: server/migrations/2026-02-05_qr_approval_requests.sql",
        ], 400);
        exit();
    }

    // Ensure the QR belongs to this user
    $check = $conn->prepare(
        "SELECT id, status, COALESCE(approval_request_status, 'none') AS approval_request_status
         FROM qr_codes
         WHERE id = :qid AND user_id = :uid"
    );
    $check->execute([':qid' => $qr_id, ':uid' => $user_id]);
    $qr = $check->fetch(PDO::FETCH_ASSOC);

    if (!$qr) {
        json_response(["error" => "Unauthorized"], 403);
        exit();
    }

    if ($qr['status'] === 'active') {
        json_response(["error" => "Link is already active"], 400);
        exit();
    }

    $reqStatus = (string) ($qr['approval_request_status'] ?? 'none');
    if ($reqStatus !== 'none') {
        // One-shot request policy: users may request approval only once.
        // This includes denied (no re-request) and approved (already resolved).
        json_response(["error" => "Approval can only be requested once"], 400);
        exit();
    }

    $stmt = $conn->prepare(
        "UPDATE qr_codes
         SET approval_request_status = 'requested',
             approval_requested_at = NOW(),
             approval_request_note = :note,
             approval_resolved_at = NULL,
             approval_resolved_by = NULL
         WHERE id = :id"
    );
    $stmt->execute([
        ':note' => ($note !== '' ? $note : null),
        ':id' => $qr_id,
    ]);

    audit_log($conn, $user_id, 'qr_request_approval', 'qr_code', $qr_id, ['note' => ($note !== '' ? $note : null)]);

    json_response(["success" => true]);
} catch (PDOException $e) {
    json_response(["error" => "Database error"], 500);
}
?>