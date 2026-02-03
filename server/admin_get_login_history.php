<?php
// server/admin_get_login_history.php
// Returns login sessions across all users (for admin/super admin consoles).

require 'db.php';
require 'utils.php';

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';

if ($limit <= 0 || $limit > 200) $limit = 50;
if ($offset < 0) $offset = 0;

try {
    $where = [];
    $params = [];

    if ($user_id > 0) {
        $where[] = 'ls.user_id = :uid';
        $params[':uid'] = $user_id;
    }

    if ($q !== '') {
        // Search by email or IP or country
        $where[] = '(u.email LIKE :q OR ls.ip_address LIKE :q OR ls.country LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }

    $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

    $sql =
        "SELECT 
            ls.id,
            ls.user_id,
            u.email,
            u.role,
            u.name,
            ls.login_time,
            ls.logout_time,
            ls.session_duration_seconds,
            ls.ip_address,
            ls.country,
            ls.device_type,
            ls.os,
            ls.browser,
            ls.user_agent
         FROM login_sessions ls
         JOIN users u ON u.id = ls.user_id
         $whereSql
         ORDER BY ls.login_time DESC
         LIMIT $limit OFFSET $offset";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(["success" => true, "data" => $rows]);
} catch (PDOException $e) {
    json_response(["error" => "Database error"], 500);
}
?>
