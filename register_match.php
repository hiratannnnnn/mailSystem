<?php
header('Content-Type: application/json');

require_once 'db_functions.php';
$conn = dbConnect();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // フォームデータの取得
    $date = $_POST['register-date'];
    $location = $_POST['register-location'];
    $memberName = trim($_POST['register-name']);
    $res = registerMatchLog($conn, $memberName, $date, $location);
    $responseMessage = $res === 0 ? "{$date}の{$location}を新規に登録しました。" : "{$date}の情報が存在していたため、{$location}に上書きしました。";
    echo $responseMessage;
    $conn->close();
}