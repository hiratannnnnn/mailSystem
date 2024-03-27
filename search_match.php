<?php

require_once 'db_functions.php';

$query = isset($_GET['query']) ? $_GET['query'] : '';
$conn = dbConnect(); // データベース接続を確立

if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $query) && strtotime($query)) {
    $tournamentNames = getTournamentNamesByDate($conn, $query);
    echo json_encode([
        'status' => 'success',
        'type' => 'date',
        'data' => $tournamentNames
    ]);
} else {
    // 文字列クエリの場合
    $tournaments = getTournamentsByName($conn, $query);
    echo json_encode([
        'status' => 'success',
        'type' => 'string',
        'data' => $tournaments
    ]);
}

$conn->close(); // データベース接続を閉じる

