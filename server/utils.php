<?php


function json_response($data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
}

function get_json_input(): array
{
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

function require_auth(): array
{
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        exit();
    }
    return [
        'id' => $_SESSION['user_id'],
        'role' => $_SESSION['role'] ?? 'user'
    ];
}

function require_role(string $role): array
{
    $user = require_auth();
    // Hierarchy: super_admin > admin > user
    $userRole = $user['role'];

    // Specific check
    if ($userRole === $role) {
        return $user;
    }

    // Role hierarchy
    if ($role === 'admin' && $userRole === 'super_admin') {
        return $user;
    }

    http_response_code(403);
    echo json_encode(["error" => "Forbidden: Requires $role access"]);
    exit();
}

function get_client_ip(): string
{
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

function parse_user_agent(string $ua): array
{
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

function lookup_country(string $ip): string
{
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
        return (string) $geo->country;
    }

    return 'Unknown';
}

function close_open_sessions(PDO $conn, int $userId): void
{
    // Close any previous sessions that never logged out.
    $stmt = $conn->prepare(
        "UPDATE login_sessions 
         SET logout_time = NOW(),
             session_duration_seconds = TIMESTAMPDIFF(SECOND, login_time, NOW())
         WHERE user_id = :uid AND logout_time IS NULL"
    );
    $stmt->execute([':uid' => $userId]);
}

function get_system_setting(PDO $conn, string $key, ?string $default = null): ?string
{
    try {
        $stmt = $conn->prepare("SELECT setting_value FROM system_settings WHERE setting_key = :k LIMIT 1");
        $stmt->execute([':k' => $key]);
        $val = $stmt->fetchColumn();
        if ($val === false || $val === null)
            return $default;
        return (string) $val;
    } catch (Exception $e) {
        // best-effort; some environments may not have system_settings
        return $default;
    }
}

function parse_list_setting(?string $value): array
{
    if ($value === null)
        return [];
    $value = trim($value);
    if ($value === '')
        return [];

    $parts = preg_split('/[\r\n,]+/', $value);
    if (!is_array($parts))
        return [];
    $out = [];
    foreach ($parts as $p) {
        $p = strtolower(trim((string) $p));
        if ($p === '')
            continue;
        $out[] = $p;
    }
    return array_values(array_unique($out));
}

function host_matches_rule(string $host, string $rule): bool
{
    $host = strtolower(trim($host));
    $rule = strtolower(trim($rule));
    if ($host === '' || $rule === '')
        return false;

    // Exact match
    if ($host === $rule)
        return true;

    // Wildcard subdomain match: *.example.com
    if (str_starts_with($rule, '*.')) {
        $suffix = substr($rule, 1); // keep leading dot
        return $suffix !== '' && str_ends_with($host, $suffix);
    }

    // Suffix match: .example.com
    if (str_starts_with($rule, '.')) {
        return str_ends_with($host, $rule);
    }

    return false;
}

function analyze_url_for_moderation(string $url): array
{
    $url = trim($url);
    $reasons = [];
    $score = 0;

    if ($url === '') {
        return ['flagged' => true, 'score' => 100, 'reason' => 'Empty URL'];
    }

    // Reject control characters / whitespace tricks (common in obfuscated links)
    if (preg_match('/[\x00-\x1F\x7F]/', $url)) {
        return ['flagged' => true, 'score' => 100, 'reason' => 'Contains control characters'];
    }

    $parsed = @parse_url($url);
    $scheme = strtolower((string) ($parsed['scheme'] ?? ''));
    $host = strtolower((string) ($parsed['host'] ?? ''));

    // Only allow http/https
    if (!in_array($scheme, ['http', 'https'], true)) {
        $score += 80;
        $reasons[] = 'Unsupported URL scheme';
    } elseif ($scheme === 'http') {
        // Not inherently malicious, but weaker security signal
        $score += 5;
        $reasons[] = 'Non-HTTPS URL';
    }

    if ($host === '') {
        $score += 60;
        $reasons[] = 'Missing host';
    }

    // Normalize host (strip trailing dot)
    if ($host !== '') {
        $host = rtrim($host, '.');
    }

    // Note: configurable blocklists are applied in moderate_destination_url().

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

    // Excessive subdomains can be a phishing signal
    if ($host !== '') {
        $dotCount = substr_count($host, '.');
        if ($dotCount >= 4) {
            $score += 10;
            $reasons[] = 'Excessive subdomains';
        }
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

/**
 * Returns a moderation decision for a destination URL.
 * - allow: link is considered safe enough to activate
 * - pause: suspicious; requires admin review
 * - ban: unwanted/high-risk; automatically banned
 */
function moderate_destination_url(PDO $conn, string $url): array
{
    $analysis = analyze_url_for_moderation($url);
    $score = (int) ($analysis['score'] ?? 0);
    $reason = (string) ($analysis['reason'] ?? '');

    $parsed = @parse_url(trim($url));
    $host = strtolower((string) ($parsed['host'] ?? ''));
    if ($host !== '') {
        $host = rtrim($host, '.');
    }
    $lowerUrl = strtolower($url);

    // Configurable blocklists via system_settings
    $blockedDomains = parse_list_setting(get_system_setting($conn, 'blocked_domains', ''));
    foreach ($blockedDomains as $rule) {
        if ($host !== '' && host_matches_rule($host, $rule)) {
            return ['action' => 'ban', 'score' => 100, 'reason' => 'Blocked domain: ' . $rule];
        }
    }

    $blockedKeywords = parse_list_setting(get_system_setting($conn, 'blocked_keywords', ''));
    foreach ($blockedKeywords as $kw) {
        if ($kw !== '' && str_contains($lowerUrl, $kw)) {
            return ['action' => 'ban', 'score' => 100, 'reason' => 'Blocked keyword: ' . $kw];
        }
    }

    $blockedTlds = parse_list_setting(get_system_setting($conn, 'blocked_tlds', ''));
    if ($host !== '' && str_contains($host, '.')) {
        $tld = substr($host, strrpos($host, '.') + 1);
        if ($tld !== '' && in_array($tld, $blockedTlds, true)) {
            return ['action' => 'ban', 'score' => 100, 'reason' => 'Blocked TLD: ' . $tld];
        }
    }

    $flagThreshold = (int) (get_system_setting($conn, 'auto_flag_score_threshold', '40') ?? '40');
    $banThreshold = (int) (get_system_setting($conn, 'auto_ban_score_threshold', '80') ?? '80');
    $flagThreshold = max(0, min(100, $flagThreshold));
    $banThreshold = max(0, min(100, $banThreshold));
    if ($banThreshold < $flagThreshold) {
        // Keep invariants sane
        $banThreshold = $flagThreshold;
    }

    if (($analysis['flagged'] ?? false) && $score >= $banThreshold) {
        return ['action' => 'ban', 'score' => $score, 'reason' => $reason !== '' ? $reason : 'High-risk URL'];
    }
    if (($analysis['flagged'] ?? false) && $score >= $flagThreshold) {
        return ['action' => 'pause', 'score' => $score, 'reason' => $reason !== '' ? $reason : 'Suspicious URL'];
    }

    return ['action' => 'allow', 'score' => $score, 'reason' => ''];
}

function audit_log(PDO $conn, ?int $actorUserId, string $action, ?string $targetType = null, ?int $targetId = null, $details = null): void
{
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