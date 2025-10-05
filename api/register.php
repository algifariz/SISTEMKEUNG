<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => 'Invalid request'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (isset($data['username']) && isset($data['password'])) {
        $username = $data['username'];
        $password = $data['password'];

        if (empty($username) || empty($password)) {
            $response['message'] = 'Username and password are required.';
        } else {
            // Check if username already exists
            $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                $response['message'] = 'Username already taken.';
            } else {
                // Hash the password
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);

                $insert_stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
                $insert_stmt->bind_param("ss", $username, $hashed_password);

                if ($insert_stmt->execute()) {
                    $response = ['success' => true, 'message' => 'Registration successful.'];
                } else {
                    $response['message'] = 'Error during registration: ' . $insert_stmt->error;
                }
                $insert_stmt->close();
            }
            $stmt->close();
        }
    } else {
        $response['message'] = 'Username and password not provided.';
    }
}

$conn->close();
echo json_encode($response);
?>