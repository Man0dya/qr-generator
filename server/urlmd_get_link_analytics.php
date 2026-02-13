<?php
require 'db.php';
require 'utils.php';

$user = require_auth();
$userId = (int) $user['id'];
$role = (string) ($user['role'] ?? 'user');
$linkId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($linkId <= 0) {
    json_response(['error' => 'id is required'], 400);
    exit();
}

try {
    if ($role === 'admin' || $role === 'super_admin') {
        $linkStmt = $conn->prepare('SELECT * FROM url_links WHERE id = :id');
        $linkStmt->execute([':id' => $linkId]);
    } else {
        $linkStmt = $conn->prepare('SELECT * FROM url_links WHERE id = :id AND user_id = :uid');
        $linkStmt->execute([':id' => $linkId, ':uid' => $userId]);
    }

    $link = $linkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$link) {
        json_response(['error' => 'Not found'], 404);
        exit();
    }

    $timelineStmt = $conn->prepare(
        "SELECT DATE(click_time) AS date, COUNT(*) AS count
         FROM url_clicks
         WHERE url_link_id = :id
         GROUP BY DATE(click_time)
         ORDER BY date ASC"
    );
    $timelineStmt->execute([':id' => $linkId]);
    $timeline = $timelineStmt->fetchAll(PDO::FETCH_ASSOC);

    $deviceStmt = $conn->prepare(
        "SELECT COALESCE(device_type, 'Unknown') AS name, COUNT(*) AS value
         FROM url_clicks
         WHERE url_link_id = :id
         GROUP BY COALESCE(device_type, 'Unknown')
         ORDER BY value DESC"
    );
    $deviceStmt->execute([':id' => $linkId]);
    $devices = $deviceStmt->fetchAll(PDO::FETCH_ASSOC);

    $countryStmt = $conn->prepare(
        "SELECT COALESCE(country, 'Unknown') AS name, COUNT(*) AS value
         FROM url_clicks
         WHERE url_link_id = :id
         GROUP BY COALESCE(country, 'Unknown')
         ORDER BY value DESC
         LIMIT 10"
    );
    $countryStmt->execute([':id' => $linkId]);
    $countries = $countryStmt->fetchAll(PDO::FETCH_ASSOC);

    $refStmt = $conn->prepare(
        "SELECT
            CASE
                WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                ELSE referrer
            END AS name,
            COUNT(*) AS value
         FROM url_clicks
         WHERE url_link_id = :id
         GROUP BY name
         ORDER BY value DESC
         LIMIT 10"
    );
    $refStmt->execute([':id' => $linkId]);
    $referrers = $refStmt->fetchAll(PDO::FETCH_ASSOC);

    $summaryStmt = $conn->prepare(
        "SELECT
            COUNT(*) AS total_clicks,
            COUNT(DISTINCT ip_address) AS unique_visitors,
            SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) AS bot_clicks,
            MAX(click_time) AS last_click_at
         FROM url_clicks
         WHERE url_link_id = :id"
    );
    $summaryStmt->execute([':id' => $linkId]);
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    json_response([
        'success' => true,
        'link' => $link,
        'summary' => $summary,
        'charts' => [
            'timeline' => $timeline,
            'devices' => $devices,
            'countries' => $countries,
            'referrers' => $referrers,
        ]
    ]);
} catch (Exception $e) {
    json_response(['error' => 'Failed to fetch analytics'], 500);
}
