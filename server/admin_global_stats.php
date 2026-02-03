<?php
// server/admin_global_stats.php

// Enable error logging
ini_set('display_errors', 0); // Don't print HTML errors to JSON output
error_reporting(E_ALL);

require 'db.php';
header('Content-Type: application/json');

$response = [
    "success" => true,
    "total_scans" => 0,
    "active_links" => 0,
    "timeline" => [],
    "devices" => [],
    "os" => [],
    "top_qrs" => []
];

try {
    // 1. Total Scans
    try {
        $stmt = $conn->query("SELECT COUNT(*) as total FROM analytics");
        $response['total_scans'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    } catch (Exception $e) { /* Ignore, keep 0 */ }

    // 2. Active Links
    try {
        $stmt = $conn->query("SELECT COUNT(*) as total FROM qr_codes WHERE status = 'active'");
        $response['active_links'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    } catch (Exception $e) { /* Ignore */ }

    // 3. Timeline (Check if table has data first)
    if ($response['total_scans'] > 0) {
        try {
            $stmt = $conn->query("
                SELECT DATE(scan_time) as date, COUNT(*) as count 
                FROM analytics 
                WHERE scan_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(scan_time) 
                ORDER BY date ASC
            ");
            $response['timeline'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) { /* Ignore */ }

        // 4. Devices
        try {
            $stmt = $conn->query("SELECT device_type as name, COUNT(*) as value FROM analytics GROUP BY device_type");
            $response['devices'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) { /* Ignore */ }

        // 5. OS
        try {
            $stmt = $conn->query("SELECT os as name, COUNT(*) as value FROM analytics GROUP BY os");
            $response['os'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) { /* Ignore */ }

        // 6. Top QRs
        try {
            $stmt = $conn->query("
                SELECT qr_codes.short_code, qr_codes.destination_url, COUNT(analytics.id) as scans 
                FROM qr_codes 
                LEFT JOIN analytics ON qr_codes.id = analytics.qr_code_id 
                GROUP BY qr_codes.id, qr_codes.short_code, qr_codes.destination_url
                ORDER BY scans DESC 
                LIMIT 5
            ");
            $response['top_qrs'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) { /* Ignore */ }
    }

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Critical DB Connection Error: " . $e->getMessage()]);
}
?>