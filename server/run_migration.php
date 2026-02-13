<?php
// server/run_migration.php
require 'db.php';

$sqlFile = __DIR__ . '/migrations/002_phase2_schema.sql';
$sql = file_get_contents($sqlFile);

if (!$sql) {
    die("Error reading migration file.");
}

try {
    // Enable exception mode specifically for this script if not already
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Split by semicolon so we can run statements individually (optional, but safer for some drivers)
    // or just run the whole block if the driver supports multiple statements.
    // PDO MySQL usually supports multiple statements if configured, but let's try raw exec first.

    $conn->exec($sql);
    echo "Migration applied successfully.\n";

} catch (PDOException $e) {
    // If column exists error (1060), ignore it
    if ($e->getCode() == '42S21' || strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "Partial warning: Columns might already exist. Continuing.\n";
    } else {
        echo "Migration failed: " . $e->getMessage() . "\n";
    }
}
?>