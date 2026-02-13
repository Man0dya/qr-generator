<?php
// server/redirect.php
require 'db.php';
require 'utils.php';
require 'urlmd_common.php';

// 1. Get the code from the URL parameter (e.g., redirect.php?c=abc123)
$code = isset($_GET['c']) ? $_GET['c'] : '';

if (empty($code)) {
    die("Invalid QR Code.");
}

try {
    // 2. DOMAIN & QR LOOKUP
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    // Remove port if present for domain matching (optional, depending on setup)
    $host_domain = preg_replace('/:\d+$/', '', $host);

    // Check if this is a custom domain
    // We assume 'localhost' or specific system domains are NOT custom. 
    // In production, you'd compare against SITE_URL from env.

    $domainStmt = $conn->prepare("SELECT id, user_id FROM custom_domains WHERE domain = :domain AND status = 'active'");
    $domainStmt->execute([':domain' => $host_domain]);
    $customDomain = $domainStmt->fetch(PDO::FETCH_ASSOC);

    $sql = "SELECT id, destination_url, status, qr_type, qr_data, custom_domain_id, url_link_id FROM qr_codes WHERE short_code = :code";
    $params = [':code' => $code];

    if ($customDomain) {
        // Enforce that the QR must belong to this domain (or at least the user of this domain)
        // Strictest: QR must be explicitly linked to this domain.
        // Looser: QR must belong to the user who owns the domain.
        // Let's go with: QR must be linked to this custom_domain_id.
        $sql .= " AND (custom_domain_id = :cd_id)";
        $params[':cd_id'] = $customDomain['id'];
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
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
            // Fallback
        }

        // 4. HANDLE QR TYPES
        $type = $qr['qr_type'] ?? 'url';
        $data = json_decode($qr['qr_data'] ?? '{}', true);

        switch ($type) {
            case 'vcard':
                // Generate vCard download
                header('Content-Type: text/vcard');
                header('Content-Disposition: attachment; filename="contact.vcf"');
                // Construct vCard content from $data
                $vcard = "BEGIN:VCARD\nVERSION:3.0\n";
                $vcard .= "FN:" . ($data['first_name'] ?? '') . " " . ($data['last_name'] ?? '') . "\n";
                $vcard .= "TEL:" . ($data['phone'] ?? '') . "\n";
                $vcard .= "EMAIL:" . ($data['email'] ?? '') . "\n";
                $vcard .= "URL:" . ($data['website'] ?? '') . "\n";
                $vcard .= "END:VCARD";
                echo $vcard;
                exit;

            case 'bio':
                // Render simple Bio page
                // In a real app, use a template engine. Here, simple HTML.
                echo "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>" . htmlspecialchars($data['title'] ?? 'Links') . "</title>";
                echo "<style>body{font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;text-align:center;background:#f8f9fa} .btn{display:block;background:#4f46e5;color:white;padding:12px;margin:10px 0;text-decoration:none;border-radius:8px;font-weight:bold} .btn:hover{opacity:0.9} img{width:100px;height:100px;border-radius:50%;object-fit:cover;margin-bottom:20px}</style>";
                echo "</head><body>";
                if (!empty($data['image']))
                    echo "<img src='" . htmlspecialchars($data['image']) . "'>";
                echo "<h1>" . htmlspecialchars($data['title'] ?? 'My Links') . "</h1>";
                echo "<p>" . htmlspecialchars($data['description'] ?? '') . "</p>";
                if (!empty($data['links']) && is_array($data['links'])) {
                    foreach ($data['links'] as $link) {
                        echo "<a href='" . htmlspecialchars($link['url']) . "' class='btn' target='_blank'>" . htmlspecialchars($link['label']) . "</a>";
                    }
                }
                echo "</body></html>";
                exit;

            case 'wifi':
                // WiFi logic (usually just text display or specialized schema, but phones scan raw text for WiFi usually. 
                // If this is a redirect, we can try to redirect to a WIFI: scheme but browsers might block it.
                // Better to show a page with the code or instructions.
                echo "<h1>Connect to WiFi</h1>";
                echo "<p>SSID: " . htmlspecialchars($data['ssid'] ?? '') . "</p>";
                $pass = htmlspecialchars($data['password'] ?? '');
                echo "<p>Password: " . $pass . "</p>";
                // Attempt auto-connect via JS or link?
                exit;

            case 'url':
            default:
                if (!empty($qr['url_link_id'])) {
                    $linkStmt = $conn->prepare(
                        "SELECT id, destination_url, status, redirect_type, expires_at
                         FROM url_links
                         WHERE id = :id
                         LIMIT 1"
                    );
                    $linkStmt->execute([':id' => (int) $qr['url_link_id']]);
                    $link = $linkStmt->fetch(PDO::FETCH_ASSOC);

                    if ($link && $link['status'] === 'active') {
                        if (!empty($link['expires_at']) && strtotime((string) $link['expires_at']) < time()) {
                            die("This short URL has expired.");
                        }

                        urlmd_track_click($conn, $link, (int) $qr['id']);
                        $target = urlmd_pick_ab_destination($conn, (int) $link['id'], (string) $link['destination_url']);
                        $code = ((string) ($link['redirect_type'] ?? '302')) === '301' ? 301 : 302;
                        header("Location: " . $target, true, $code);
                        exit;
                    }
                }

                header("Location: " . $qr['destination_url']);
                exit;
        }


    } else {
        $linkSql = "SELECT id, destination_url, status, redirect_type, expires_at, custom_domain_id
                    FROM url_links
                    WHERE short_code = :code";
        $linkParams = [':code' => $code];

        if ($customDomain) {
            $linkSql .= " AND (custom_domain_id = :cd_id)";
            $linkParams[':cd_id'] = $customDomain['id'];
        }

        $linkStmt = $conn->prepare($linkSql);
        $linkStmt->execute($linkParams);
        $link = $linkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$link) {
            die("QR Code not found.");
        }

        if ($link['status'] !== 'active') {
            die("This short URL is not active.");
        }

        if (!empty($link['expires_at']) && strtotime((string) $link['expires_at']) < time()) {
            die("This short URL has expired.");
        }

        urlmd_track_click($conn, $link, null);
        $target = urlmd_pick_ab_destination($conn, (int) $link['id'], (string) $link['destination_url']);
        $redirectCode = ((string) ($link['redirect_type'] ?? '302')) === '301' ? 301 : 302;
        header("Location: " . $target, true, $redirectCode);
        exit;
    }

} catch (PDOException $e) {
    // Ideally log the error to a file instead of showing it to the user
    die("Server Error.");
}
?>