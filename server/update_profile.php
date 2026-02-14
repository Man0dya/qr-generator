<?php
// server/update_profile.php
require 'db.php';
require 'utils.php';
require 'security.php';

$user = require_auth();
$user_id = $user['id'];

$input = json_decode(file_get_contents("php://input"), true);
$name = sanitize_string($input['name'] ?? '', 100);
$email = sanitize_string($input['email'] ?? '', 255);

if (empty($email)) {
    http_response_code(400);
    echo json_encode(["error" => "Email is required"]);
    exit();
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid email format"]);
    exit();
}

try {
    // 1. Check if email is being changed and if it's already taken by another user
    $check = $conn->prepare("SELECT id FROM users WHERE email = :email AND id != :uid");
    $check->execute([':email' => $email, ':uid' => $user_id]);
    if ($check->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["error" => "Email already in use by another account"]);
        exit();
    }

    // 2. Update User
    $stmt = $conn->prepare("UPDATE users SET name = :name, email = :email WHERE id = :uid");
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':uid' => $user_id
    ]);

    // 3. Fetch updated user data to return to frontend
    $refresh = $conn->prepare("SELECT id, name, email, role, provider FROM users WHERE id = :uid");
    $refresh->execute([':uid' => $user_id]);
    $newUser = $refresh->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully",
        "user" => $newUser
    ]);

} catch (PDOException $e) {
    error_log('Profile update error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Database error"]);
}
?>