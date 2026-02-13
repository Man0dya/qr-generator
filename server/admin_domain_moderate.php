<?php
require 'db.php';
require 'utils.php';

$user = require_role('admin');
$actorUserId = (int) $user['id'];
$input = get_json_input();

$domainId = isset($input['id']) ? (int) $input['id'] : 0;
$action = trim((string) ($input['action'] ?? ''));

if ($domainId <= 0 || $action === '') {
    json_response(['error' => 'id and action are required'], 400);
    exit();
}

try {
    if ($action === 'activate' || $action === 'pending' || $action === 'invalidate') {
        $nextStatus = $action === 'invalidate' ? 'invalid' : $action;

        $stmt = $conn->prepare('UPDATE custom_domains SET status = :status WHERE id = :id');
        $stmt->execute([
            ':status' => $nextStatus,
            ':id' => $domainId,
        ]);

        if ($stmt->rowCount() === 0) {
            json_response(['error' => 'Not found'], 404);
            exit();
        }

        audit_log($conn, $actorUserId, 'domain_status_change', 'domain', $domainId, ['status' => $nextStatus]);
        json_response(['success' => true]);
        exit();
    }

    if ($action === 'delete') {
        $stmt = $conn->prepare('DELETE FROM custom_domains WHERE id = :id');
        $stmt->execute([':id' => $domainId]);

        if ($stmt->rowCount() === 0) {
            json_response(['error' => 'Not found'], 404);
            exit();
        }

        audit_log($conn, $actorUserId, 'domain_delete', 'domain', $domainId);
        json_response(['success' => true]);
        exit();
    }

    json_response(['error' => 'Invalid action'], 400);
} catch (Exception $e) {
    json_response(['error' => 'Failed to moderate domain'], 500);
}
