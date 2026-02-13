<?php
require 'db.php';
require 'utils.php';

$user = require_role('admin');

$status = trim((string) ($_GET['status'] ?? 'all'));
$q = trim((string) ($_GET['q'] ?? ''));

$where = ['1=1'];
$params = [];

if ($status !== '' && $status !== 'all') {
    $where[] = 'l.status = :status';
    $params[':status'] = $status;
}

if ($q !== '') {
    $where[] = '(l.short_code LIKE :q OR l.destination_url LIKE :q OR u.email LIKE :q)';
    $params[':q'] = '%' . $q . '%';
}

$whereSql = implode(' AND ', $where);

try {
    $sql =
        "SELECT
            l.id,
            l.short_code,
            l.destination_url,
            l.status,
            l.is_flagged,
            l.flag_reason,
            l.created_at,
            u.id AS user_id,
            u.email,
            (SELECT COUNT(*) FROM url_clicks c WHERE c.url_link_id = l.id) AS total_clicks
         FROM url_links l
         INNER JOIN users u ON u.id = l.user_id
         WHERE {$whereSql}
         ORDER BY l.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(['success' => true, 'data' => $rows]);
} catch (Exception $e) {
    json_response(['error' => 'Failed to fetch URL links'], 500);
}
