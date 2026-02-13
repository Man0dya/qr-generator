<?php
// server/domains.php
require 'db.php';
require 'utils.php';

$user = require_auth();
$user_id = $user['id'];
$method = $_SERVER['REQUEST_METHOD'];

// GET: List domains
if ($method === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM custom_domains WHERE user_id = :uid ORDER BY created_at DESC");
        $stmt->execute([':uid' => $user_id]);
        $domains = $stmt->fetchAll(PDO::FETCH_ASSOC);
        json_response(['success' => true, 'data' => $domains]);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error'], 500);
    }
}

// POST: Add new domain
if ($method === 'POST') {
    $data = get_json_input();
    $domain = trim($data['domain'] ?? '');

    // Basic validation (simple regex for domain)
    if (!preg_match('/^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/', $domain)) {
        json_response(['error' => 'Invalid domain format'], 400);
        exit;
    }

    try {
        // Check uniqueness
        $check = $conn->prepare("SELECT id FROM custom_domains WHERE domain = :domain");
        $check->execute([':domain' => $domain]);
        if ($check->fetch()) {
            json_response(['error' => 'Domain already registered'], 400);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO custom_domains (user_id, domain, status) VALUES (:uid, :domain, 'active')");
        // In a real app, status might be 'pending' until DNS verification.
        // For this demo, we'll auto-activate.

        $stmt->execute([':uid' => $user_id, ':domain' => $domain]);

        json_response(['success' => true, 'id' => $conn->lastInsertId(), 'domain' => $domain, 'status' => 'active']);
    } catch (PDOException $e) {
        json_response(['error' => 'Failed to add domain'], 500);
    }
}

// DELETE: Remove domain
if ($method === 'DELETE') {
    $domain_id = $_GET['id'] ?? 0;

    try {
        // Only allow deleting own domain
        $stmt = $conn->prepare("DELETE FROM custom_domains WHERE id = :id AND user_id = :uid");
        $stmt->execute([':id' => $domain_id, ':uid' => $user_id]);

        if ($stmt->rowCount() > 0) {
            // Optional: Set qr_codes.custom_domain_id to NULL for affected QRs?
            // The FK has ON DELETE SET NULL, so this happens automatically.
            json_response(['success' => true]);
        } else {
            json_response(['error' => 'Domain not found or access denied'], 404);
        }
    } catch (PDOException $e) {
        json_response(['error' => 'Database error'], 500);
    }
}
?>