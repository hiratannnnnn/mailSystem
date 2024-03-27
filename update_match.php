<?php
header('Content-Type: application/json');

require_once 'db_functions.php';
$conn = dbConnect();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // フォームデータの取得
    $date = $_POST['edit-date'];
    $location = $_POST['edit-location'];
    $matchNum = $_POST['edit-matchNum'];
    //$location = $location . " " . $matchNum . "回戦";
    $memberName = trim($_POST['edit-member-name']);
    $memberRuby = trim($_POST['edit-member-ruby']);
    $memberClub = trim($_POST['edit-member-club']);
    $opponentName = trim($_POST['edit-opponent-name']);
    if($opponentName === "")$opponentName = " ";
    $opponentRuby = trim($_POST['edit-opponent-ruby']);
    $opponentClub = trim($_POST['edit-opponent-club']);
    $result = $_POST['result'];
    $number = $_POST['number'];
    $matchId = $_POST['matchId'];

    // 対戦情報の更新
    $stmt = $conn->prepare("UPDATE 対戦情報 SET 日時 = ?, 場所 = ?, 勝敗情報1 = ?, 勝敗情報2 = ? WHERE 対戦ID = ?");
    $stmt->bind_param("ssiii", $date, $location, $result, $number, $matchId);
    if (!$stmt->execute()) {
        // エラーハンドリング
        echo json_encode(['error' => '対戦情報の更新に失敗しました。']);
        exit;
    }

    // 会員IDと対戦者IDの取得
    $stmt = $conn->prepare("SELECT 会員ID, 対戦者ID FROM 対戦情報 WHERE 対戦ID = ?");
    $stmt->bind_param("i", $matchId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $memberId = $row['会員ID'];
    $opponentId = $row['対戦者ID'];

    // 選手情報の更新（会員）
    $stmt = $conn->prepare("UPDATE 選手情報 SET 氏名 = ?, ふりがな = ?, 所属会 = ? WHERE 選手ID = ?");
    $stmt->bind_param("sssi", $memberName, $memberRuby, $memberClub, $memberId);
    $stmt->execute();

    // 選手情報の更新（対戦者）
    if ($opponentName != " ") { // 不戦勝（空欄）でない場合のみ更新
        $stmt = $conn->prepare("UPDATE 選手情報 SET 氏名 = ?, ふりがな = ?, 所属会 = ? WHERE 選手ID = ?");
        $stmt->bind_param("sssi", $opponentName, $opponentRuby, $opponentClub, $opponentId);
        $stmt->execute();
    }

    // 処理が成功したことをクライアントに通知
    $responseMessage = "{$location} {$matchNum}回戦での{$memberName}と{$opponentName}の対戦を更新しました。";
    echo $responseMessage;
    
    $conn->close();
}