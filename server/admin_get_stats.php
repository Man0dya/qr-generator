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

// Security Check
$user = require_role('admin');

try {
    // 1. Get All Users
    $usersStmt = $conn->query("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC");
    $users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

    $hasApprovalColumns = column_exists($conn, 'qr_codes', 'approval_request_status');

    $approvalSelect = $hasApprovalColumns
        ? "COALESCE(q.approval_request_status, 'none') as approval_request_status,
            q.approval_requested_at,
            q.approval_request_note,
            q.approval_resolved_at,
            q.approval_resolved_by,"
        : "'none' as approval_request_status,
            NULL as approval_requested_at,
            NULL as approval_request_note,
            NULL as approval_resolved_at,
            NULL as approval_resolved_by,";

    $approvalOrder = $hasApprovalColumns
        ? "CASE COALESCE(q.approval_request_status, 'none') WHEN 'requested' THEN 0 ELSE 1 END,"
        : "";

    // 2. Get All QR Codes (For moderation)
    $qrsStmt = $conn->query("
        SELECT 
            q.id,
            q.short_code,
            q.destination_url,
            q.status,
            COALESCE(q.is_flagged, 0) as is_flagged,
            q.flag_reason,
            q.flagged_at,
            {$approvalSelect}
            q.reviewed_at,
            u.email as creator 
        FROM qr_codes q
        JOIN users u ON q.user_id = u.id
        ORDER BY
            {$approvalOrder}
            CASE q.status
                WHEN 'banned' THEN 0
                WHEN 'paused' THEN 1
                ELSE 2
            END,
            COALESCE(q.is_flagged, 0) DESC,
            q.created_at DESC
    ");
    $qrs = $qrsStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "users" => $users,
        "qrs" => $qrs
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>