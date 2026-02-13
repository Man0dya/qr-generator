<?php
// server/super_admin_action.php
require 'db.php';
require 'utils.php';

$user = require_role('super_admin');
$actor_user_id = $user['id'];

$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? '';
$target_id = $input['target_id'] ?? null;
$new_role = $input['new_role'] ?? null;
// $actor_user_id from input is ignored

// Security Note: In production, verify the requester is actually a super_admin here!

try {
    if ($action === 'delete_user') {
        // Delete user (Cascades to delete their QR codes too because of Foreign Keys)
        $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $target_id]);
        audit_log($conn, $actor_user_id, 'user_delete', 'user', (int) $target_id);
        echo json_encode(["success" => true, "message" => "User deleted"]);

    } elseif ($action === 'change_role') {
        // Promote/Demote logic
        $stmt = $conn->prepare("UPDATE users SET role = :role WHERE id = :id");
        $stmt->execute([':role' => $new_role, ':id' => $target_id]);
        audit_log($conn, $actor_user_id, 'user_change_role', 'user', (int) $target_id, ['new_role' => $new_role]);
        echo json_encode(["success" => true, "message" => "Role updated"]);
    }
    // Assignment Requirement: "Create User" manually
    elseif ($action === 'create_user') {
        $email = $input['email'];
        $password = password_hash($input['password'], PASSWORD_DEFAULT);
        $role = $input['role'];

        $stmt = $conn->prepare("INSERT INTO users (email, password, role) VALUES (:email, :pass, :role)");
        $stmt->execute([':email' => $email, ':pass' => $password, ':role' => $role]);
        $newId = (int) $conn->lastInsertId();
        audit_log($conn, $actor_user_id, 'user_create', 'user', $newId, ['email' => $email, 'role' => $role]);
        echo json_encode(["success" => true, "message" => "User created manually"]);
    } elseif ($action === 'force_logout') {
        $uid = (int) $target_id;
        if ($uid <= 0) {
            echo json_encode(["error" => "Invalid target_id"]);
            exit();
        }
        // Best-effort: close any open sessions
        try {
            close_open_sessions($conn, $uid);
        } catch (Exception $e) {
        }
        audit_log($conn, $actor_user_id, 'user_force_logout', 'user', $uid);
        echo json_encode(["success" => true, "message" => "User sessions closed"]);

    } elseif ($action === 'delete_domain') {
        $did = (int) $target_id;
        $stmt = $conn->prepare("DELETE FROM custom_domains WHERE id = :id");
        $stmt->execute([':id' => $did]);
        audit_log($conn, $actor_user_id, 'domain_delete', 'domain', $did);
        echo json_encode(["success" => true, "message" => "Domain deleted"]);

    } elseif ($action === 'delete_team') {
        $tid = (int) $target_id;
        $stmt = $conn->prepare("DELETE FROM teams WHERE id = :id");
        $stmt->execute([':id' => $tid]);
        audit_log($conn, $actor_user_id, 'team_delete', 'team', $tid);
        echo json_encode(["success" => true, "message" => "Team deleted"]);

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>