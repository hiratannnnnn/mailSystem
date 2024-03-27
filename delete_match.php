<?php
header('Content-Type: application/json');

require_once 'db_functions.php';
$conn = dbConnect();

// matchIdの取得
if (isset($_GET['matchId'])) {
    $matchId = (int) $_GET['matchId'];

    // トランザクション開始
    $conn->begin_transaction();

    try {
        // 管理用テーブルから該当する対戦IDのデータを削除
        $stmt = $conn->prepare("DELETE FROM 管理用 WHERE 対戦ID = ?");
        $stmt->bind_param("i", $matchId);
        $stmt->execute();

        // 対戦情報テーブルから対戦IDに該当する行を削除
        $stmt = $conn->prepare("DELETE FROM 対戦情報 WHERE 対戦ID = ?");
        $stmt->bind_param("i", $matchId);
        $stmt->execute();

        // トランザクションをコミット
        $conn->commit();

        $response = ['success' => true, 'message' => '対戦情報を削除しました。'];
    } catch (Exception $e) {
        // エラーが発生した場合はロールバック
        $conn->rollback();

        $response = ['success' => false, 'message' => '対戦情報の削除に失敗しました。'];
    }

    // JSON形式で結果を返す
    echo json_encode($response);
} else {
    echo json_encode(['success' => false, 'message' => '対戦IDが指定されていません。']);
}

$conn->close();
?>
