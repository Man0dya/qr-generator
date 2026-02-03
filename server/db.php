<?php
// server/db.php

// 1. CORS Headers (Crucial for Next.js to talk to PHP locally)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Database Credentials
// CHANGE THESE when you deploy to cPanel
$host = 'localhost';
$db_name = 'qr_generator_db';
$username = 'root'; // Default for XAMPP/Local
$password = '';     // Default for XAMPP/Local

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    // Set error mode to exception for debugging
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit();
}
?>