<?php

function json_response($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
}

function get_client_ip(): string {
    // Basic support for proxies; in production you should trust only known proxies.
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function parse_user_agent(string $ua): array {
    $uaLower = strtolower($ua);

    // Device
    $device = 'Desktop';
    if (preg_match('/ipad|tablet/', $uaLower)) {
        $device = 'Tablet';
    } elseif (preg_match('/android|iphone|ipod|mobile/', $uaLower)) {
        $device = 'Mobile';
    }

    // OS
    $os = 'Unknown';
    if (preg_match('/windows nt/', $uaLower)) {
        $os = 'Windows';
    } elseif (preg_match('/android/', $uaLower)) {
        $os = 'Android';
    } elseif (preg_match('/iphone|ipad|ipod/', $uaLower)) {
        $os = 'iOS';
    } elseif (preg_match('/mac os x|macintosh/', $uaLower)) {
        $os = 'macOS';
    } elseif (preg_match('/linux/', $uaLower)) {
        $os = 'Linux';
    }

    // Browser
    $browser = 'Unknown';
    if (preg_match('/edg\//', $uaLower)) {
        $browser = 'Edge';
    } elseif (preg_match('/opr\//', $uaLower) || preg_match('/opera/', $uaLower)) {
        $browser = 'Opera';
    } elseif (preg_match('/chrome\//', $uaLower) && !preg_match('/edg\//', $uaLower)) {
        $browser = 'Chrome';
    } elseif (preg_match('/safari\//', $uaLower) && !preg_match('/chrome\//', $uaLower)) {
        $browser = 'Safari';
    } elseif (preg_match('/firefox\//', $uaLower)) {
        $browser = 'Firefox';
    }

    return [
        'device_type' => $device,
        'os' => $os,
        'browser' => $browser,
    ];
}

function lookup_country(string $ip): string {
    if ($ip === '127.0.0.1' || $ip === '::1' || $ip === '0.0.0.0') {
        return 'Local';
    }

    // IP-API is simple; in production consider a paid GeoIP DB.
    $geoJson = @file_get_contents('http://ip-api.com/json/' . urlencode($ip));
    if ($geoJson === false) {
        return 'Unknown';
    }

    $geo = @json_decode($geoJson);
    if ($geo && isset($geo->status) && $geo->status === 'success' && isset($geo->country)) {
        return (string)$geo->country;
    }

    return 'Unknown';
}

function close_open_sessions(PDO $conn, int $userId): void {
    // Close any previous sessions that never logged out.
    $stmt = $conn->prepare(
        "UPDATE login_sessions 
         SET logout_time = NOW(),
             session_duration_seconds = TIMESTAMPDIFF(SECOND, login_time, NOW())
         WHERE user_id = :uid AND logout_time IS NULL"
    );
    $stmt->execute([':uid' => $userId]);
}

function analyze_url_for_moderation(string $url): array {
    $url = trim($url);
    $reasons = [];
    $score = 0;

    if ($url === '') {
        return ['flagged' => true, 'score' => 100, 'reason' => 'Empty URL'];
    }

    $parsed = @parse_url($url);
    $scheme = strtolower((string)($parsed['scheme'] ?? ''));
    $host = strtolower((string)($parsed['host'] ?? ''));

    if (!in_array($scheme, ['http', 'https'], true)) {
        $score += 50;
        $reasons[] = 'Non-HTTP scheme';
    }

    if ($host === '') {
        $score += 60;
        $reasons[] = 'Missing host';
    }

    // Common URL shorteners
    $shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly', 'rebrand.ly'];
    if ($host !== '' && in_array($host, $shorteners, true)) {
        $score += 40;
        $reasons[] = 'URL shortener domain';
    }

    // Suspicious TLDs (heuristic)
    $suspiciousTlds = ['zip', 'mov', 'click', 'top', 'xyz', 'tk', 'gq', 'ml', 'cf'];
    $tld = '';
    if ($host !== '' && strpos($host, '.') !== false) {
        $tld = substr($host, strrpos($host, '.') + 1);
    }
    if ($tld !== '' && in_array($tld, $suspiciousTlds, true)) {
        $score += 15;
        $reasons[] = 'Suspicious TLD';
    }

    // Punycode often indicates phishing-like domains
    if ($host !== '' && str_starts_with($host, 'xn--')) {
        $score += 20;
        $reasons[] = 'Punycode domain';
    }

    // IP address host
    if ($host !== '' && preg_match('/^\d{1,3}(?:\.\d{1,3}){3}$/', $host)) {
        $score += 25;
        $reasons[] = 'IP address host';
    }

    // Keywords (very rough)
    $lower = strtolower($url);
    $badKeywords = ['malware', 'phishing', 'password-reset', 'verify-account', 'free-money', 'crypto-giveaway'];
    foreach ($badKeywords as $kw) {
        if (str_contains($lower, $kw)) {
            $score += 20;
            $reasons[] = 'Suspicious keyword: ' . $kw;
            break;
        }
    }

    $flagged = $score >= 40;
    $reason = $flagged ? implode('; ', array_values(array_unique($reasons))) : '';

    return ['flagged' => $flagged, 'score' => $score, 'reason' => $reason];
}

function audit_log(PDO $conn, ?int $actorUserId, string $action, ?string $targetType = null, ?int $targetId = null, $details = null): void {
    $ip = get_client_ip();
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

    $detailsText = null;
    if ($details !== null) {
        $detailsText = is_string($details) ? $details : json_encode($details);
    }

    try {
        $stmt = $conn->prepare(
            "INSERT INTO admin_audit_logs (actor_user_id, action, target_type, target_id, details, ip_address, user_agent)
             VALUES (:actor, :action, :tt, :tid, :details, :ip, :ua)"
        );
        $stmt->execute([
            ':actor' => $actorUserId,
            ':action' => $action,
            ':tt' => $targetType,
            ':tid' => $targetId,
            ':details' => $detailsText,
            ':ip' => $ip,
            ':ua' => $ua,
        ]);
    } catch (Exception $e) {
        // best-effort; do not break requests if audit table isn't present
    }
}

?>
