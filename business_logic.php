<?php
require_once 'db_functions.php'; // データベース接続関数が定義されたファイルを読み込む

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // フォームデータの取得
    $date = $_POST['date'];
    $location = $_POST['location'];
    $matchNum = $_POST['matchNum'];
    //$location = $location . " " . $matchNum . "回戦";
    $memberName = trim($_POST['member-name']);
    $memberRuby = trim($_POST['member-ruby']);
    $memberClub = trim($_POST['member-club']);
    $opponentName = trim($_POST['opponent-name']);
    if($opponentName === "")$opponentName = " ";
    $opponentRuby = trim($_POST['opponent-ruby']);
    $opponentClub = trim($_POST['opponent-club']);
    $result = $_POST['result1'];
    $number = $_POST['result2'];

    $conn = dbConnect();

    $responseMessage = registerMatch($conn, $date,$location,$matchNum,$memberName, $memberRuby,$memberClub,$opponentName,$opponentRuby,$opponentClub,$result,$number);
    echo $responseMessage;
    
    $conn->close();
}
?>
