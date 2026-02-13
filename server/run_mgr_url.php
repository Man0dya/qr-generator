<?php
require 'db.php';
require 'utils.php';

// Read the SQL file
$sqlFile = 'migrations/2026-02-14_url_approval_requests.sql';
if (!file_exists($sqlFile)) {
    die("Migration file not found: $sqlFile\n");
}

$sql = file_get_contents($sqlFile);

try {
    // Check if columns exist first to avoid errors
    $check = $conn->query("SHOW COLUMNS FROM url_links LIKE 'approval_request_status'");
    if ($check->rowCount() > 0) {
        echo "Columns already exist. Skipping migration.\n";
    } else {
        // Execute the SQL
        $conn->exec($sql);
        echo "Migration executed successfully!\n";
    }
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>