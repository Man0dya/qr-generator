<?php
// server/login.php
require 'db.php';
require 'utils.php';

$input = json_decode(file_get_contents("php://input"), true);
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["error" => "Email and Password are required"]);
    exit();
}

try {
    // FIXED: Added 'name' to the SELECT statement
    $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        // Close any previous sessions for clean duration tracking
        close_open_sessions($conn, (int)$user['id']);

        // Create new login session
        $ip = get_client_ip();
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $parsed = parse_user_agent($ua);
        $country = lookup_country($ip);

        $ins = $conn->prepare(
            "INSERT INTO login_sessions (user_id, ip_address, country, device_type, os, browser, user_agent)
             VALUES (:uid, :ip, :country, :device, :os, :browser, :ua)"
        );
        $ins->execute([
            ':uid' => (int)$user['id'],
            ':ip' => $ip,
            ':country' => $country,
            ':device' => $parsed['device_type'],
            ':os' => $parsed['os'],
            ':browser' => $parsed['browser'],
            ':ua' => substr($ua, 0, 512),
        ]);
        $sessionId = (int)$conn->lastInsertId();

        // Remove password before sending to frontend
        unset($user['password']);

        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "user" => $user, // This now contains 'name'
            "session_id" => $sessionId
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid credentials"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error"]);
}
?>