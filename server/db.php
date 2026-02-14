<?php
// server/db.php

// 1. Load Environment Variables from .env
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0)
            continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $_ENV[trim($parts[0])] = trim($parts[1]);
        }
    }
}

// 2. Secure Session Start
$isSecureCookie = filter_var($_ENV['COOKIE_SECURE'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
session_set_cookie_params([
    'lifetime' => 0,       // Session cookie (expires on browser close)
    'path' => '/',
    'domain' => '',
    'secure' => $isSecureCookie,  // true in production (HTTPS), false for localhost dev
    'httponly' => true,            // Blocks JavaScript access to cookie
    'samesite' => 'Strict'        // Prevents cross-site request attacks
]);
session_start();

/**
 * Regenerate the session ID to prevent session fixation.
 * Call this after successful authentication.
 */
function regenerate_session(): void
{
    session_regenerate_id(true);
}

// 3. CORS Headers (Allow Credentials for Sessions)
// Read allowed origins from env (comma-separated) or fall back to localhost
$allowed_origins_str = $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost:3000';
$allowed_origins = array_map('trim', explode(',', $allowed_origins_str));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 4. Database Credentials
$host = $_ENV['DB_HOST'] ?? 'localhost';
$db_name = $_ENV['DB_NAME'] ?? 'qr_generator_db';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["error" => "Connection failed"]);
    exit();
}
?>