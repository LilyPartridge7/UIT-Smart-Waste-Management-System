<?php
$conn = new mysqli('127.0.0.1', 'root', 'password', 'db', 3306);
$tables = ['bins', 'reports'];
$schema = [];
foreach($tables as $t) {
    if (!$conn->query("DESCRIBE $t")) {
        echo "Table $t not found. Error: " . $conn->error . "\n";
        continue;
    }
    $res = $conn->query("DESCRIBE $t");
    $cols = [];
    while($row = $res->fetch_assoc()) {
        $cols[] = $row['Field'];
    }
    $schema[$t] = $cols;
}
echo json_encode($schema);
