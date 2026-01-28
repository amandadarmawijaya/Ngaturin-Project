<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'db.php';

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

// ✅ correct JSON validation
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON input",
        "json_error" => json_last_error_msg()
    ]);
    exit;
}

$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$timestamp = date('Y-m-d H:i:s');

if ($username === '' || $email === '' || $password === '') {
    echo json_encode([
        "success" => false,
        "error" => "All fields are required"
    ]);
    exit;
}

// 🔐 hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// insert
$stmt = $conn->prepare(
    "INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)"
);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "error" => "Prepare failed"
    ]);
    exit;
}

$stmt->bind_param("ssss", $username, $email, $hashedPassword, $timestamp);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true
    ]);
} else {
    echo json_encode([
        "success" => false,
        "error" => "Email already exists"
    ]);
}

$stmt->close();
$conn->close();