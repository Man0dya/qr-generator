<?php
// server/api_keys.php
require 'db.php';
require 'utils.php';

$user = require_auth();
$user_id = $user['id'];
$method = $_SERVER['REQUEST_METHOD'];

function generateApiKey()
{
    return 'pk_' . bin2hex(random_bytes(16));
}

// GET: List API keys
if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT id, name, api_key, last_used_at, created_at FROM api_keys WHERE user_id = :uid ORDER BY created_at DESC");
    $stmt->execute([':uid' => $user_id]);
    $keys = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Mask keys for security in list view? 
    // Usually we show them once or allow copy. 
    // For simplicity, I'll send them.
    json_response(['success' => true, 'data' => $keys]);
}

// POST: Create API key
if ($method === 'POST') {
    $data = get_json_input();
    $name = trim($data['name'] ?? 'Default Key');

    $key = generateApiKey();

    $stmt = $conn->prepare("INSERT INTO api_keys (user_id, api_key, name) VALUES (:uid, :key, :name)");
    try {
        $stmt->execute([':uid' => $user_id, ':key' => $key, ':name' => $name]);
        json_response(['success' => true, 'key' => $key, 'name' => $name, 'id' => $conn->lastInsertId()]);
    } catch (PDOException $e) {
        json_response(['error' => 'Failed to create key'], 500);
    }
}

// DELETE: Revoke API key
if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        json_response(['error' => 'Missing ID'], 400);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM api_keys WHERE id = :id AND user_id = :uid");
    $stmt->execute([':id' => $id, ':uid' => $user_id]);

    json_response(['success' => true]);
}
?>