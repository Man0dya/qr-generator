<?php
// server/admin_get_domains.php
require 'db.php';
require 'utils.php';

$user = require_role('admin');

try {
    $stmt = $conn->prepare("
        SELECT d.*, u.email as user_email, u.name as user_name
        FROM custom_domains d
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
    ");
    $stmt->execute();
    $domains = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(['success' => true, 'data' => $domains]);
} catch (PDOException $e) {
    json_response(['error' => 'Database error'], 500);
}
?>