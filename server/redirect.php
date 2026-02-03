<?php
// server/redirect.php
require 'db.php';
require 'utils.php';

// 1. Get the code from the URL parameter (e.g., redirect.php?c=abc123)
$code = isset($_GET['c']) ? $_GET['c'] : '';

if (empty($code)) {
    die("Invalid QR Code.");
}

try {
    // 2. Find the destination URL
    $stmt = $conn->prepare("SELECT id, destination_url, status FROM qr_codes WHERE short_code = :code");
    $stmt->execute([':code' => $code]);
    $qr = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($qr) {
        if ($qr['status'] !== 'active') {
            die("This QR code has been disabled.");
        }

        // 3. TRACK ANALYTICS
        $ip = get_client_ip();
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $ua = parse_user_agent($user_agent);
        $country = lookup_country($ip);

        // Insert analytics record
        // Prefer inserting browser if the column exists; fall back for older schemas.
        try {
            $logStmt = $conn->prepare(
                "INSERT INTO analytics (qr_code_id, ip_address, device_type, os, browser, country)
                 VALUES (:qr_id, :ip, :device, :os, :browser, :country)"
            );
            $logStmt->execute([
                ':qr_id' => $qr['id'],
                ':ip' => $ip,
                ':device' => $ua['device_type'],
                ':os' => $ua['os'],
                ':browser' => $ua['browser'],
                ':country' => $country,
            ]);
        } catch (PDOException $e) {
            // Older schema without analytics.browser
            $logStmt = $conn->prepare(
                "INSERT INTO analytics (qr_code_id, ip_address, device_type, os, country)
                 VALUES (:qr_id, :ip, :device, :os, :country)"
            );
            $logStmt->execute([
                ':qr_id' => $qr['id'],
                ':ip' => $ip,
                ':device' => $ua['device_type'],
                ':os' => $ua['os'],
                ':country' => $country,
            ]);
        }

        // 4. PERFORM REDIRECT
        header("Location: " . $qr['destination_url']);
        exit();
        
    } else {
        die("QR Code not found.");
    }

} catch (PDOException $e) {
    // Ideally log the error to a file instead of showing it to the user
    die("Server Error.");
}
?>