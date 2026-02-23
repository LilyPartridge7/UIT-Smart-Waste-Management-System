<?php
require 'db_config.php';
$stmt = $conn->query("SELECT * FROM bins");
$bins = [];
while($row = $stmt->fetch_assoc()) {
    $bins[] = $row;
}
echo json_encode($bins, JSON_PRETTY_PRINT);
