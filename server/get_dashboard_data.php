<?php
// server/get_dashboard_data.php
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

// 2. Auth Check
$user = require_auth();
$user_id = $user['id'];

// Remove the old GET check


try {
    $hasFlagColumns = column_exists($conn, 'qr_codes', 'is_flagged') && column_exists($conn, 'qr_codes', 'flag_reason');
    $hasApprovalColumns = column_exists($conn, 'qr_codes', 'approval_request_status');
    $hasUrlLinkColumn = column_exists($conn, 'qr_codes', 'url_link_id');

    $flagSelect = $hasFlagColumns
        ? "COALESCE(q.is_flagged, 0) AS is_flagged, q.flag_reason,"
        : "0 AS is_flagged, NULL AS flag_reason,";

    $approvalSelect = $hasApprovalColumns
        ? "COALESCE(q.approval_request_status, 'none') AS approval_request_status,
            q.approval_requested_at,
            q.approval_request_note,
            q.approval_resolved_at,
            q.approval_resolved_by,"
        : "'none' AS approval_request_status,
            NULL AS approval_requested_at,
            NULL AS approval_request_note,
            NULL AS approval_resolved_at,
            NULL AS approval_resolved_by,";

    $urlLinkSelect = $hasUrlLinkColumn
        ? "q.url_link_id,"
        : "NULL AS url_link_id,";

    $sql = "
        SELECT 
            q.id, 
            q.short_code, 
            q.destination_url, 
            q.status, 
            q.created_at,
            q.design_config,
            {$urlLinkSelect}
            {$flagSelect}
            {$approvalSelect}
            (
                SELECT COUNT(*)
                FROM analytics a
                WHERE a.qr_code_id = q.id
            ) AS total_scans
        FROM qr_codes q
        WHERE q.user_id = :uid
        ORDER BY q.created_at DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':uid' => $user_id]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $data]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>