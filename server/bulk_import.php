<?php
// server/bulk_import.php
require 'db.php';
require 'utils.php';

$user = require_auth();
$user_id = $user['id'];
$method = $_SERVER['REQUEST_METHOD'];

function generateRandomString($length = 6)
{
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $randomString;
}

if ($method === 'POST') {
    if (!isset($_FILES['file'])) {
        json_response(['error' => 'No file uploaded'], 400);
        exit;
    }

    $file = $_FILES['file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if ($ext !== 'csv') {
        json_response(['error' => 'Only CSV files are allowed'], 400);
        exit;
    }

    $handle = fopen($file['tmp_name'], 'r');
    if ($handle === false) {
        json_response(['error' => 'Failed to read file'], 500);
        exit;
    }

    // Read header row
    $header = fgetcsv($handle);
    // Ideally validate header (e.g. expect 'url', 'label', etc.)

    $created = 0;
    $errors = 0;
    $results = [];

    // Limit execution time/memory if possible, or enforce row limit
    $max_rows = 50;
    $row_count = 0;

    $conn->beginTransaction();

    try {
        // Log import start
        $stmt = $conn->prepare("INSERT INTO bulk_imports (user_id, filename, status) VALUES (:uid, :name, 'processing')");
        $stmt->execute([':uid' => $user_id, ':name' => $file['name']]);
        $import_id = $conn->lastInsertId();

        while (($data = fgetcsv($handle)) !== false) {
            $row_count++;
            if ($row_count > $max_rows)
                break;

            // Simple assumption: Column 1 is URL, Column 2 (optional) is a label/name?
            $url = trim($data[0] ?? '');

            if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
                $errors++;
                $results[] = ['row' => $row_count, 'status' => 'error', 'message' => 'Invalid URL'];
                continue;
            }

            // Generate QR
            $code = generateRandomString();
            // Basic moderation (reuse logic if properly modularized, or simplified here)
            // For bulk, let's assume we want to be careful.
            // Simplified insertion:
            $stmt = $conn->prepare("INSERT INTO qr_codes (user_id, destination_url, short_code, status, qr_type) VALUES (:uid, :url, :code, 'active', 'url')");
            $stmt->execute([':uid' => $user_id, ':url' => $url, ':code' => $code]);

            $created++;
            $results[] = ['row' => $row_count, 'status' => 'success', 'short_code' => $code, 'url' => $url];
        }

        // Update import log
        $upd = $conn->prepare("UPDATE bulk_imports SET status = 'completed', total_records = :total WHERE id = :id");
        $upd->execute([':total' => $created, ':id' => $import_id]);

        $conn->commit();

        fclose($handle);

        json_response([
            'success' => true,
            'total_processed' => $row_count,
            'created' => $created,
            'errors' => $errors,
            'details' => $results
        ]);

    } catch (Exception $e) {
        $conn->rollBack();
        json_response(['error' => 'Import failed: ' . $e->getMessage()], 500);
    }
}
?>