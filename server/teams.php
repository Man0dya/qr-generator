<?php
// server/teams.php
require 'db.php';
require 'utils.php';

$user = require_auth();
$user_id = $user['id'];
$method = $_SERVER['REQUEST_METHOD'];

// Helper to check team membership
function get_user_team_role(PDO $conn, int $user_id, int $team_id)
{
    // Check if owner
    $stmt = $conn->prepare("SELECT id FROM teams WHERE id = :tid AND owner_id = :uid");
    $stmt->execute([':tid' => $team_id, ':uid' => $user_id]);
    if ($stmt->fetch())
        return 'owner';

    // Check member
    $stmt = $conn->prepare("SELECT role FROM team_members WHERE team_id = :tid AND user_id = :uid");
    $stmt->execute([':tid' => $team_id, ':uid' => $user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['role'] : null;
}

// GET: List teams user belongs to
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        // Get details of specific team (members, etc)
        $team_id = (int) $_GET['id'];
        $role = get_user_team_role($conn, $user_id, $team_id);

        if (!$role) {
            json_response(['error' => 'Access denied'], 403);
            exit;
        }

        $stmt = $conn->prepare("SELECT * FROM teams WHERE id = :tid");
        $stmt->execute([':tid' => $team_id]);
        $team = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get members
        $mStmt = $conn->prepare("
            SELECT tm.id, tm.role, tm.joined_at, u.email, u.name 
            FROM team_members tm 
            JOIN users u ON tm.user_id = u.id 
            WHERE tm.team_id = :tid
        ");
        $mStmt->execute([':tid' => $team_id]);
        $members = $mStmt->fetchAll(PDO::FETCH_ASSOC);

        // Add owner to list if not strictly in team_members (schema design choice)
        // My schema: `teams` has `owner_id`. Usually owner is implicitly admin.
        // Let's also fetch owner details.
        $oStmt = $conn->prepare("SELECT id, name, email FROM users WHERE id = :uid");
        $oStmt->execute([':uid' => $team['owner_id']]);
        $owner = $oStmt->fetch(PDO::FETCH_ASSOC);

        json_response(['success' => true, 'team' => $team, 'role' => $role, 'members' => $members, 'owner' => $owner]);
    } else {
        // List all teams
        // Teams owned
        $ownedStmt = $conn->prepare("SELECT *, 'owner' as role FROM teams WHERE owner_id = :uid");
        $ownedStmt->execute([':uid' => $user_id]);
        $owned = $ownedStmt->fetchAll(PDO::FETCH_ASSOC);

        // Teams joined
        $joinedStmt = $conn->prepare("
            SELECT t.*, tm.role 
            FROM teams t 
            JOIN team_members tm ON t.id = tm.team_id 
            WHERE tm.user_id = :uid
        ");
        $joinedStmt->execute([':uid' => $user_id]);
        $joined = $joinedStmt->fetchAll(PDO::FETCH_ASSOC);

        json_response(['success' => true, 'data' => array_merge($owned, $joined)]);
    }
}

// POST: Create Team or Add Member
if ($method === 'POST') {
    $data = get_json_input();

    // Action: create_team
    if (isset($data['name']) && !isset($data['team_id'])) {
        $name = trim($data['name']);
        if (empty($name)) {
            json_response(['error' => 'Team name required'], 400);
            exit;
        }
        try {
            $stmt = $conn->prepare("INSERT INTO teams (owner_id, name) VALUES (:uid, :name)");
            $stmt->execute([':uid' => $user_id, ':name' => $name]);
            json_response(['success' => true, 'id' => $conn->lastInsertId(), 'name' => $name]);
        } catch (PDOException $e) {
            json_response(['error' => 'Failed to create team'], 500);
        }
    }
    // Action: add_member (invite)
    elseif (isset($data['team_id'], $data['email'])) {
        $team_id = (int) $data['team_id'];
        $email = trim($data['email']);
        $role = $data['role'] ?? 'viewer';

        $myRole = get_user_team_role($conn, $user_id, $team_id);
        if ($myRole !== 'owner' && $myRole !== 'admin') {
            json_response(['error' => 'Only admins can add members'], 403);
            exit;
        }

        // Find user by email
        $uStmt = $conn->prepare("SELECT id FROM users WHERE email = :email");
        $uStmt->execute([':email' => $email]);
        $targetUser = $uStmt->fetch(PDO::FETCH_ASSOC);

        if (!$targetUser) {
            json_response(['error' => 'User not found'], 404);
            exit;
        }

        // Prevent adding owner as member (redundant)
        // Check if already member
        try {
            $stmt = $conn->prepare("INSERT INTO team_members (team_id, user_id, role) VALUES (:tid, :uid, :role)");
            $stmt->execute([':tid' => $team_id, ':uid' => $targetUser['id'], ':role' => $role]);
            json_response(['success' => true]);
        } catch (PDOException $e) {
            json_response(['error' => 'User likely already in team'], 400);
        }
    }
}

// DELETE: Delete Team or Remove Member
if ($method === 'DELETE') {
    $team_id = (int) ($_GET['team_id'] ?? 0);
    $member_id = (int) ($_GET['member_id'] ?? 0); // user_id to remove

    if (!$team_id) {
        json_response(['error' => 'Missing team_id'], 400);
        exit;
    }

    $myRole = get_user_team_role($conn, $user_id, $team_id);

    if ($member_id) {
        // Remove member
        if ($myRole !== 'owner' && $myRole !== 'admin') {
            json_response(['error' => 'Permission denied'], 403);
            exit;
        }
        if ($member_id == $user_id && $myRole === 'owner') {
            json_response(['error' => 'Owner cannot leave team, delete it instead'], 400);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM team_members WHERE team_id = :tid AND user_id = :uid");
        $stmt->execute([':tid' => $team_id, ':uid' => $member_id]);
        json_response(['success' => true]);
    } else {
        // Delete Team
        if ($myRole !== 'owner') {
            json_response(['error' => 'Only owner can delete team'], 403);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM teams WHERE id = :tid");
        $stmt->execute([':tid' => $team_id]);
        json_response(['success' => true]);
    }
}
?>