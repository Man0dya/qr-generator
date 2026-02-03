<?php
// server/register.php
require 'db.php';

$input = json_decode(file_get_contents("php://input"), true);
$name = $input['name'] ?? '';
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password) || empty($name)) {
    http_response_code(400);
    echo json_encode(["error" => "All fields (Name, Email, Password) are required"]);
    exit();
}

try {
    // 1. Check if email exists
    $check = $conn->prepare("SELECT id FROM users WHERE email = :email");
    $check->execute([':email' => $email]);
    
    if ($check->rowCount() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["error" => "Email already registered"]);
        exit();
    }

    // 2. Hash Password
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);

    // 3. Insert User
    // FIXED: Changed 'password_hash' to 'password' to match your DB
    $stmt = $conn->prepare("INSERT INTO users (name, email, password) VALUES (:name, :email, :pass)");
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':pass' => $hashed_password
    ]);

    echo json_encode(["success" => true, "message" => "User registered successfully"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>