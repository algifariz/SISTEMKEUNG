<?php
// A simple script to test the database connection and report errors.

// Database configuration from api/config.php
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', ''); // Using an empty password as configured
define('DB_NAME', 'money_tracker');

// Attempt to establish database connection
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Check and report connection status
if ($conn->connect_error) {
    echo "Connection failed: " . $conn->connect_error . "\n";
} else {
    echo "Connection successful!\n";
    $conn->close();
}
?>