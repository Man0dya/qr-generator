<?php
// server/get_dashboard_data.php
require 'db.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode([]);
    exit();
}

try {
    // This query selects the QR code details AND counts the matching rows in the analytics table
    $sql = "
        SELECT 
            q.id, 
            q.short_code, 
            q.destination_url, 
            q.status, 
            q.created_at,
            COUNT(a.id) as total_scans
        FROM qr_codes q
        LEFT JOIN analytics a ON q.id = a.qr_code_id
        WHERE q.user_id = :uid
        GROUP BY q.id
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