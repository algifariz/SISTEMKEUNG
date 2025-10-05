<?php
session_start();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true) {
    echo json_encode(['success' => true, 'username' => $_SESSION['username']]);
} else {
    echo json_encode(['success' => false]);
}
?>