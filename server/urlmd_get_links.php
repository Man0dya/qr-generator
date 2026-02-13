<?php
require 'db.php';
require 'utils.php';

$user = require_auth();
$userId = (int) $user['id'];

$status = trim((string) ($_GET['status'] ?? 'all'));
$q = trim((string) ($_GET['q'] ?? ''));

$where = ["l.user_id = :uid"];
$params = [':uid' => $userId];

if ($status !== '' && $status !== 'all') {
    $where[] = "l.status = :status";
    $params[':status'] = $status;
}

if ($q !== '') {
    $where[] = "(l.short_code LIKE :q OR l.destination_url LIKE :q OR l.title LIKE :q)";
    $params[':q'] = '%' . $q . '%';
}

$whereSql = implode(' AND ', $where);

try {
    $sql =
        "SELECT
            l.id,
            l.short_code,
            l.destination_url,
            l.title,
            l.note,
            l.status,
            l.redirect_type,
            l.expires_at,
            l.is_flagged,
            l.flag_reason,
            l.created_at,
            l.updated_at,
            d.domain AS custom_domain,
            (SELECT COUNT(*) FROM url_clicks c WHERE c.url_link_id = l.id) AS total_clicks,
            (SELECT COUNT(DISTINCT c.ip_address) FROM url_clicks c WHERE c.url_link_id = l.id AND c.ip_address IS NOT NULL) AS unique_visitors,
            (SELECT MAX(c.click_time) FROM url_clicks c WHERE c.url_link_id = l.id) AS last_click_at
         FROM url_links l
         LEFT JOIN custom_domains d ON d.id = l.custom_domain_id
         WHERE {$whereSql}
         ORDER BY l.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(['success' => true, 'data' => $rows]);
} catch (Exception $e) {
    json_response(['error' => 'Failed to fetch links'], 500);
}
