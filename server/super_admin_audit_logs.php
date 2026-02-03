<?php
// server/super_admin_audit_logs.php
// Returns audit logs for super admin visibility.

require 'db.php';
require 'utils.php';

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';

if ($limit <= 0 || $limit > 200) $limit = 100;
if ($offset < 0) $offset = 0;

try {
    $where = [];
    $params = [];

    if ($q !== '') {
        $where[] = '(u.email LIKE :q OR l.action LIKE :q OR l.target_type LIKE :q OR l.details LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }

    $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

    $sql =
        "SELECT
            l.id,
            l.actor_user_id,
            u.email as actor_email,
            l.action,
            l.target_type,
            l.target_id,
            l.details,
            l.ip_address,
            l.created_at
         FROM admin_audit_logs l
         LEFT JOIN users u ON u.id = l.actor_user_id
         $whereSql
         ORDER BY l.created_at DESC
         LIMIT $limit OFFSET $offset";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(["success" => true, "data" => $rows]);
} catch (PDOException $e) {
    json_response(["error" => "Database error"], 500);
}
?>
