<?php
header('Content-Type: application/json');

require_once 'db_functions.php';
$conn = dbConnect();

if (isset($_GET['data'])) {
    // URLデコードしてから、カンマで分割
    $data = explode(',', urldecode($_GET['data']));
    
    // 分割した配列から個別のデータを取り出す
    $name = $data[0];
    $memberId = getOrCreatePlayerId($conn, $name, '', '慶應かるた会');
    $date = $data[1];

    $sql = "DELETE FROM 出場大会一覧 WHERE 選手ID = ? AND 日時 = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $memberId, $date);
    $stmt->execute();
    $stmt->close();
    // 処理結果をJSON形式で返す場合
    echo json_encode(['success' => true, 'message' => "{$date}の記録を削除しました。"]);
} else {
    // エラー処理
    echo json_encode(['success' => false, 'message' => 'データが指定されていません。']);
}