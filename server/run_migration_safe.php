<?php
// server/run_migration_safe.php
require 'db.php';

echo "Starting Safe Migration...\n";

// 1. Create Tables
$tablesSql = "
CREATE TABLE IF NOT EXISTS custom_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('pending', 'active', 'invalid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) DEFAULT 'My API Key',
    api_key VARCHAR(64) NOT NULL UNIQUE,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bulk_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255),
    status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
    total_records INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
";

try {
    $conn->exec($tablesSql);
    echo "Tables created or already exist.\n";
} catch (Exception $e) {
    echo "Table creation error (might be ignored if trivial): " . $e->getMessage() . "\n";
}

// 2. Add Columns safely
function addColumnIfNotExists($conn, $table, $column, $definition)
{
    try {
        $check = $conn->query("SHOW COLUMNS FROM $table LIKE '$column'");
        if ($check->rowCount() == 0) {
            $conn->exec("ALTER TABLE $table ADD COLUMN $column $definition");
            echo "Added column $column to $table.\n";
        } else {
            echo "Column $column already exists in $table.\n";
        }
    } catch (Exception $e) {
        echo "Error adding column $column: " . $e->getMessage() . "\n";
    }
}

addColumnIfNotExists($conn, 'qr_codes', 'custom_domain_id', 'INT NULL');
addColumnIfNotExists($conn, 'qr_codes', 'team_id', 'INT NULL');
addColumnIfNotExists($conn, 'qr_codes', 'qr_type', "ENUM('url', 'vcard', 'wifi', 'app', 'bio') DEFAULT 'url'");
addColumnIfNotExists($conn, 'qr_codes', 'qr_data', 'JSON NULL');

// 3. Add Constraints safely
function addConstraintIfNotExists($conn, $table, $name, $definition)
{
    try {
        // Query information_schema to check if constraint exists
        $dbname = 'qr_generator_db'; // Default, but better to get from connection if possible or config
        // Actually, let's use a simpler check: try/catch
        $conn->exec("ALTER TABLE $table ADD CONSTRAINT $name $definition");
        echo "Added constraint $name to $table.\n";
    } catch (Exception $e) {
        // Check error code for duplicate key
        if (strpos($e->getMessage(), 'Duplicate key') !== false || $e->getCode() == '23000' || strpos($e->getMessage(), 'errno: 121') !== false) {
            echo "Constraint $name already exists (skipped).\n";
        } else {
            echo "Error adding constraint $name: " . $e->getMessage() . "\n";
        }
    }
}

addConstraintIfNotExists($conn, 'qr_codes', 'fk_custom_domain', 'FOREIGN KEY (custom_domain_id) REFERENCES custom_domains(id) ON DELETE SET NULL');
addConstraintIfNotExists($conn, 'qr_codes', 'fk_team', 'FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL');

echo "Migration completed.\n";
?>