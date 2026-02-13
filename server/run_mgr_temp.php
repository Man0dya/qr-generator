<?php
require 'db.php';

$sqlFile = __DIR__ . '/migrations/2026-02-05_qr_approval_requests.sql';
if (!file_exists($sqlFile)) {
    die("Migration file not found: $sqlFile\n");
}

$sql = file_get_contents($sqlFile);

// Split by semicolon, but be careful with stored procedures if any (this file seems simple enough)
// The file uses PREPARE/EXECUTE which might need special handling if run via PHP multiple queries.
// Actually, the file content shows `SET @sql ... PREPARE ... EXECUTE`.
// PDO might not like multiple statements in one go depending on config.
// Let's try to run it as a raw exec if the driver allows, or split it.
// The file has specific `TE` delimiters? No, standard SQL but uses variables.

try {
    // Enable multiple statements
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, 1);
    
    $conn->exec($sql);
    echo "Migration executed successfully.\n";
    
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
