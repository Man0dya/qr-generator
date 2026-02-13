<?php
require 'db.php';
require 'utils.php';

$user = require_role('admin');
$actorUserId = (int) $user['id'];
$input = get_json_input();

$teamId = isset($input['id']) ? (int) $input['id'] : 0;
$action = trim((string) ($input['action'] ?? ''));

if ($teamId <= 0 || $action === '') {
    json_response(['error' => 'id and action are required'], 400);
    exit();
}

try {
    if ($action === 'delete') {
        $stmt = $conn->prepare('DELETE FROM teams WHERE id = :id');
        $stmt->execute([':id' => $teamId]);

        if ($stmt->rowCount() === 0) {
            json_response(['error' => 'Not found'], 404);
            exit();
        }

        audit_log($conn, $actorUserId, 'team_delete', 'team', $teamId);
        json_response(['success' => true]);
        exit();
    }

    json_response(['error' => 'Invalid action'], 400);
} catch (Exception $e) {
    json_response(['error' => 'Failed to moderate team'], 500);
}
