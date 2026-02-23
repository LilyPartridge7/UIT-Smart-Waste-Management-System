<?php
$conn = new mysqli('127.0.0.1', 'root', 'password', 'db', 3306);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$res = $conn->query("SELECT * FROM bins LIMIT 1");
if ($res) {
    print_r($res->fetch_assoc());
} else {
    echo "Error: " . $conn->error;
}
