<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => 'Invalid request'];

if ($method == 'GET') {
    $sql = "SELECT * FROM transactions ORDER BY date DESC";
    $result = $conn->query($sql);

    if ($result) {
        $transactions = [];
        while ($row = $result->fetch_assoc()) {
            // Ensure amount is float
            $row['amount'] = (float)$row['amount'];
            $transactions[] = $row;
        }
        $response = ['success' => true, 'data' => $transactions];
    } else {
        $response['message'] = "Error fetching data: " . $conn->error;
    }
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['action'])) {
        $action = $data['action'];

        switch ($action) {
            case 'add':
                if (isset($data['data'])) {
                    $t = $data['data'];
                    $stmt = $conn->prepare("INSERT INTO transactions (type, amount, category, date, description) VALUES (?, ?, ?, ?, ?)");
                    $stmt->bind_param("sdsss", $t['type'], $t['amount'], $t['category'], $t['date'], $t['description']);

                    if ($stmt->execute()) {
                        $t['id'] = $stmt->insert_id;
                        $response = ['success' => true, 'data' => $t];
                    } else {
                        $response['message'] = "Error adding transaction: " . $stmt->error;
                    }
                    $stmt->close();
                } else {
                    $response['message'] = "Missing transaction data for 'add' action.";
                }
                break;

            case 'update':
                if (isset($data['data'])) {
                    $t = $data['data'];
                    $stmt = $conn->prepare("UPDATE transactions SET type = ?, amount = ?, category = ?, date = ?, description = ? WHERE id = ?");
                    $stmt->bind_param("sdsssi", $t['type'], $t['amount'], $t['category'], $t['date'], $t['description'], $t['id']);

                    if ($stmt->execute()) {
                        $response = ['success' => true, 'data' => $t];
                    } else {
                        $response['message'] = "Error updating transaction: " . $stmt->error;
                    }
                    $stmt->close();
                } else {
                    $response['message'] = "Missing transaction data for 'update' action.";
                }
                break;

            case 'delete':
                if (isset($data['id'])) {
                    $id = $data['id'];
                    $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ?");
                    $stmt->bind_param("i", $id);

                    if ($stmt->execute()) {
                        $response = ['success' => true, 'id' => $id];
                    } else {
                        $response['message'] = "Error deleting transaction: " . $stmt->error;
                    }
                    $stmt->close();
                } else {
                    $response['message'] = "Missing transaction ID for 'delete' action.";
                }
                break;

            default:
                $response['message'] = "Invalid action specified.";
                break;
        }
    } else {
        $response['message'] = "No action specified.";
    }
}

$conn->close();

echo json_encode($response);
?>