<?php
// server/admin_get_teams.php
require 'db.php';
require 'utils.php';

$user = require_role('admin');

try {
    $stmt = $conn->prepare("
        SELECT t.*, u.email as owner_email, u.name as owner_name,
        (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count
        FROM teams t
        LEFT JOIN users u ON t.owner_id = u.id
        ORDER BY t.created_at DESC
    ");
    $stmt->execute();
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(['success' => true, 'data' => $teams]);
} catch (PDOException $e) {
    json_response(['error' => 'Database error'], 500);
}
?>