<?php
// server/security.php — Security middleware (rate limiting, CSRF, input helpers)

/**
 * File-based rate limiter.
 * Tracks attempts per key (e.g. "login:192.168.1.1") in a temp directory.
 * Returns true if the request is allowed, or sends 429 and exits if exceeded.
 */
function check_rate_limit(string $key, int $maxAttempts = 5, int $windowSeconds = 900): bool
{
    $dir = rtrim($_ENV['RATE_LIMIT_DIR'] ?? sys_get_temp_dir() . '/qr_rate_limits', '/');
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }

    // Sanitize key for filesystem
    $filename = $dir . '/' . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key) . '.json';

    $attempts = [];
    if (file_exists($filename)) {
        $raw = @file_get_contents($filename);
        $attempts = $raw ? (json_decode($raw, true) ?? []) : [];
    }

    $now = time();
    // Remove expired attempts
    $attempts = array_values(array_filter($attempts, function (int $ts) use ($now, $windowSeconds) {
        return ($now - $ts) < $windowSeconds;
    }));

    if (count($attempts) >= $maxAttempts) {
        $retryAfter = $windowSeconds - ($now - $attempts[0]);
        http_response_code(429);
        header('Retry-After: ' . max(1, $retryAfter));
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Too many requests. Please try again later.',
            'retry_after_seconds' => max(1, $retryAfter),
        ]);
        exit();
    }

    // Record this attempt
    $attempts[] = $now;
    @file_put_contents($filename, json_encode($attempts), LOCK_EX);

    return true;
}

/**
 * Clear rate limit for a key (e.g. after successful login).
 */
function clear_rate_limit(string $key): void
{
    $dir = rtrim($_ENV['RATE_LIMIT_DIR'] ?? sys_get_temp_dir() . '/qr_rate_limits', '/');
    $filename = $dir . '/' . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key) . '.json';
    if (file_exists($filename)) {
        @unlink($filename);
    }
}

/**
 * Generate a CSRF token and store it in the session.
 */
function generate_csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate the CSRF token from the X-CSRF-Token header.
 * Call this on state-changing requests (POST/PUT/DELETE).
 */
function validate_csrf_token(): bool
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || empty($_SESSION['csrf_token'])) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid or missing CSRF token']);
        exit();
    }
    if (!hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid or missing CSRF token']);
        exit();
    }
    return true;
}

/**
 * Sanitize and trim a string input to a maximum length.
 */
function sanitize_string(string $input, int $maxLength = 255): string
{
    return mb_substr(trim($input), 0, $maxLength);
}

/**
 * Validate that a URL is a proper http/https URL.
 * Returns true if valid, false otherwise.
 */
function validate_url(string $url): bool
{
    $url = trim($url);
    if ($url === '') {
        return false;
    }
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }
    $scheme = strtolower(parse_url($url, PHP_URL_SCHEME) ?? '');
    return in_array($scheme, ['http', 'https'], true);
}

/**
 * Validate password strength.
 * Returns an error message string if invalid, or empty string if OK.
 */
function validate_password_strength(string $password): string
{
    if (strlen($password) < 8) {
        return 'Password must be at least 8 characters long';
    }
    if (strlen($password) > 256) {
        return 'Password must be 256 characters or fewer';
    }
    if (!preg_match('/[a-zA-Z]/', $password)) {
        return 'Password must contain at least one letter';
    }
    if (!preg_match('/[0-9]/', $password)) {
        return 'Password must contain at least one number';
    }
    return '';
}

/**
 * Validate destination URL before redirect (prevents open redirect attacks).
 * Only allows http:// and https:// schemes.
 */
function validate_redirect_url(string $url): bool
{
    $url = trim($url);
    $scheme = strtolower(parse_url($url, PHP_URL_SCHEME) ?? '');
    return in_array($scheme, ['http', 'https'], true);
}
?>