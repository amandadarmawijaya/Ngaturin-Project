<?php
header('Content-Type: application/json');
error_reporting(0);

require_once 'db.php';

// Read raw JSON input
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

// Validate JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON input"
    ]);
    exit;
}

// Get inputs
$username    = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

// Validate required fields
if ($username === '' || $password === '') {
    echo json_encode([
        "success" => false,
        "error" => "username and password are required"
    ]);
    exit;
}

// Fetch user by username
$stmt = $conn->prepare(
    "SELECT id, username, email, password_hash 
     FROM users 
     WHERE username = ? 
     LIMIT 1"
);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "error" => "Prepare failed"
    ]);
    exit;
}

$stmt->bind_param("s", $username);
$stmt->execute();

$result = $stmt->get_result();
$user = $result->fetch_assoc();

$stmt->close();
$conn->close();

// User not found
if (!$user) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid username or password"
    ]);
    exit;
}

// Verify password
if (!password_verify($password, $user['password_hash'])) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid username or password"
    ]);
    exit;
}

// ✅ Login success
echo json_encode([
    "success" => true,
    "user" => [
        "id" => $user['id'],
        "username" => $user['username'],
        "email" => $user['email'],
        "role" => "user"
    ]
]);