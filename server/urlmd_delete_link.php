<?php
require 'db.php';
require 'utils.php';

$user = require_auth();
$userId = (int) $user['id'];
$input = get_json_input();

$linkId = isset($input['id']) ? (int) $input['id'] : 0;
if ($linkId <= 0) {
    json_response(['error' => 'id is required'], 400);
    exit();
}

try {
    $stmt = $conn->prepare('DELETE FROM url_links WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $linkId, ':uid' => $userId]);

    if ($stmt->rowCount() === 0) {
        json_response(['error' => 'Not found'], 404);
        exit();
    }

    json_response(['success' => true]);
} catch (Exception $e) {
    json_response(['error' => 'Failed to delete link'], 500);
}
