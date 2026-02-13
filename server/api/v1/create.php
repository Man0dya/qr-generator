<?php
// server/api/v1/create.php
// Public API Endpoint
// Authentication via Bearer Token (API Key)

require '../../db.php';
require '../../utils.php';

// disable CORS for public API? No, we might want to allow it from anywhere if it's an API.
// db.php handles CORS but it might be restrictive to localhost. 
// For a public API, we might want * or let the user handle it.
// keeping db.php logic for now.

// 1. Authenticate via API Key
$headers = getallheaders();
$apiKey = null;

if (isset($headers['Authorization'])) {
    if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        $apiKey = $matches[1];
    }
} elseif (isset($headers['X-Api-Key'])) {
    $apiKey = $headers['X-Api-Key'];
}

if (!$apiKey) {
    json_response(['error' => 'Missing API Key'], 401);
    exit;
}

$stmt = $conn->prepare("SELECT user_id, id FROM api_keys WHERE api_key = :key");
$stmt->execute([':key' => $apiKey]);
$keyData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$keyData) {
    json_response(['error' => 'Invalid API Key'], 401);
    exit;
}

$user_id = $keyData['user_id'];
$key_id = $keyData['id'];

// Update usage
$conn->prepare("UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = :id")->execute([':id' => $key_id]);

// 2. Process Request
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
    exit;
}

$data = get_json_input();
$url = trim($data['url'] ?? '');
$custom_domain_id = isset($data['domain_id']) ? (int) $data['domain_id'] : null;

// Validation
if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    json_response(['error' => 'Invalid URL'], 400);
    exit;
}

// Moderation (Reuse logic? Copy for now to be safe and independent)
$domain = parse_url($url, PHP_URL_HOST);
$bannedDomains = ['malware.com', 'phishing.site', 'bad-example.com']; // Example
if (in_array($domain, $bannedDomains)) {
    json_response(['error' => 'URL is not allowed'], 400);
    exit;
}

// Check custom domain ownership if provided
if ($custom_domain_id) {
    $dCheck = $conn->prepare("SELECT id FROM custom_domains WHERE id = :id AND user_id = :uid AND status = 'active'");
    $dCheck->execute([':id' => $custom_domain_id, ':uid' => $user_id]);
    if (!$dCheck->fetch()) {
        json_response(['error' => 'Invalid or inactive custom domain'], 400);
        exit;
    }
}

// Generate code
function generateRandomStringV1($length = 6)
{
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $randomString;
}

$short_code = generateRandomStringV1();

try {
    $stmt = $conn->prepare("INSERT INTO qr_codes (user_id, destination_url, short_code, status, qr_type, custom_domain_id) VALUES (:uid, :url, :code, 'active', 'url', :did)");
    $stmt->execute([
        ':uid' => $user_id,
        ':url' => $url,
        ':code' => $short_code,
        ':did' => $custom_domain_id
    ]);

    // Construct final URL
    // We need to know the base domain of the service.
    // For now assuming localhost:8000 or from Env.
    // Ideally we store system base URL in settings.
    $baseUrl = 'http://localhost:8000'; // TODO: Make dynamic
    if ($custom_domain_id) {
        // Fetch domain name
        $dStmt = $conn->prepare("SELECT domain FROM custom_domains WHERE id = :id");
        $dStmt->execute([':id' => $custom_domain_id]);
        $dRow = $dStmt->fetch();
        $finalUrl = "http://" . $dRow['domain'] . "/" . $short_code;
    } else {
        $finalUrl = $baseUrl . "/" . $short_code;
    }

    json_response([
        'success' => true,
        'short_code' => $short_code,
        'qr_url' => $finalUrl,
        'destination_url' => $url
    ]);

} catch (PDOException $e) {
    json_response(['error' => 'Database error'], 500);
}
?>