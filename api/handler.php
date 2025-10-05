<?php
session_start();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$user_id = $_SESSION['id'];
$response = ['success' => false, 'message' => 'Invalid request'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $stmt = $conn->prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        $transactions = [];
        while ($row = $result->fetch_assoc()) {
            $row['amount'] = (float)$row['amount'];
            $transactions[] = $row;
        }
        $response = ['success' => true, 'data' => $transactions];
    } else {
        $response['message'] = "Error fetching data: " . $conn->error;
    }
    $stmt->close();
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['action'])) {
        $action = $data['action'];

        switch ($action) {
            case 'add':
                if (isset($data['data'])) {
                    $t = $data['data'];
                    $stmt = $conn->prepare("INSERT INTO transactions (user_id, type, amount, category, date, description) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->bind_param("isdsss", $user_id, $t['type'], $t['amount'], $t['category'], $t['date'], $t['description']);

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
                    $stmt = $conn->prepare("UPDATE transactions SET type = ?, amount = ?, category = ?, date = ?, description = ? WHERE id = ? AND user_id = ?");
                    $stmt->bind_param("sdsssii", $t['type'], $t['amount'], $t['category'], $t['date'], $t['description'], $t['id'], $user_id);

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
                    $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
                    $stmt->bind_param("ii", $id, $user_id);

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

            case 'clear':
                $stmt = $conn->prepare("DELETE FROM transactions WHERE user_id = ?");
                $stmt->bind_param("i", $user_id);
                if ($stmt->execute()) {
                    $response = ['success' => true];
                } else {
                    $response['message'] = "Error clearing data: " . $conn->error;
                }
                $stmt->close();
                break;

            case 'batch_add':
                if (isset($data['data']) && is_array($data['data'])) {
                    $conn->begin_transaction();
                    try {
                        $stmt = $conn->prepare("INSERT INTO transactions (user_id, type, amount, category, date, description) VALUES (?, ?, ?, ?, ?, ?)");
                        foreach ($data['data'] as $t) {
                            $stmt->bind_param("isdsss", $user_id, $t['type'], $t['amount'], $t['category'], $t['date'], $t['description']);
                            $stmt->execute();
                        }
                        $stmt->close();
                        $conn->commit();
                        $response = ['success' => true];
                    } catch (mysqli_sql_exception $exception) {
                        $conn->rollback();
                        $response['message'] = "Error during batch insert: " . $exception->getMessage();
                    }
                } else {
                    $response['message'] = "Missing transaction data for 'batch_add' action.";
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