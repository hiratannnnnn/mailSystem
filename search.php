<?php
header('Content-Type: application/json');

require_once 'db_functions.php';

$query = isset($_GET['query']) ? $_GET['query'] : '';
//echo $query;
$results = [];

$conn = dbConnect();

if (!empty($query)) {
    $results = searchPlayers($conn, $query);
}

echo json_encode($results);

$conn->close();


function searchPlayers($conn, $query) {
    $stmt = $conn->prepare("SELECT * FROM 選手情報 WHERE 氏名 LIKE ? OR ふりがな LIKE ?");
    $searchTerm = '%' . $query . '%';
    $stmt->bind_param("ss", $searchTerm, $searchTerm);
    $stmt->execute();
    $result = $stmt->get_result();
    $players = [];
    while ($row = $result->fetch_assoc()) {
        $players[] = [
            "playerId" => $row["選手ID"],
            "name" => $row["氏名"],
            "ruby" => $row["ふりがな"],
            "club" => $row["所属会"]
        ];
    }
    return $players;
}