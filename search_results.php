<?php
require_once 'db_functions.php';
// 接続を確立
$conn = dbConnect();

// クエリパラメータから氏名を取得
$name = isset($_GET['name']) ? $_GET['name'] : '';

// SQL文を準備
// ここでは例として氏名を基に対戦情報を検索するクエリを用意します
// 実際のテーブル名やカラム名に合わせてください
$sql = 
"SELECT 
対戦情報.日時,
会員.氏名 AS 会員氏名,
会員.ふりがな AS 会員ふりがな,
会員.所属会 AS 会員所属会,
対戦相手.氏名 AS 対戦相手氏名,
対戦相手.ふりがな AS 対戦相手ふりがな,
対戦相手.所属会 AS 対戦相手所属会,
対戦情報.勝敗情報1,
対戦情報.勝敗情報2,
対戦情報.場所,
対戦情報.回戦,
CASE
    WHEN 会員.氏名 = ? THEN 0
    ELSE 1
END AS 指名側フラグ,
対戦情報.対戦ID
FROM 
対戦情報
INNER JOIN 管理用 ON 対戦情報.対戦ID = 管理用.対戦ID
INNER JOIN 選手情報 AS 会員 ON 対戦情報.会員ID = 会員.選手ID
INNER JOIN 選手情報 AS 対戦相手 ON 対戦情報.対戦者ID = 対戦相手.選手ID
WHERE 
    対戦情報.対戦ID IN (
        SELECT DISTINCT 対戦ID
        FROM 管理用
        INNER JOIN 選手情報 ON 管理用.選手ID = 選手情報.選手ID
        WHERE 選手情報.氏名 = ?
    )
ORDER BY 対戦情報.回戦 ASC, 対戦情報.日時 ASC;
";
// SQLステートメントを準備
$stmt = $conn->prepare($sql);

// 検索用語を設定
$searchTerm = urldecode($name);
$stmt->bind_param("ss",$searchTerm,$searchTerm);

// クエリの実行
$stmt->execute();
$result = $stmt->get_result();

// 結果を配列に格納
$matches = [];
$uniqueMatchIds = []; // 一意の対戦IDを格納する配列

while ($row = $result->fetch_assoc()) {
    $matchId = $row['対戦ID']; // 現在の行の対戦IDを取得
    // この対戦IDが既に処理されていないかチェック
    if (!in_array($matchId, $uniqueMatchIds)) {
        $uniqueMatchIds[] = $matchId; // 対戦IDを一意のリストに追加

        // 重複していない場合のみ、対戦情報を$matchesに追加
        $matches[] = [
            'date' => $row['日時'],
            'memberName' => $row['会員氏名'],
            'memberRuby' => $row['会員ふりがな'],
            'memberClub' => $row['会員所属会'],
            'opponentName' => $row['対戦相手氏名'],
            'opponentRuby' => $row['対戦相手ふりがな'],
            'opponentClub' => $row['対戦相手所属会'],
            'result' => $row['勝敗情報1'],
            'number' => $row['勝敗情報2'],
            'location' => $row['場所'],
            'matchNum' => $row['回戦'],
            'flag' => $row['指名側フラグ'],
            'matchId' => $matchId // 対戦IDを配列に追加
        ];
    }
}

// 結果をJSON形式で出力
header('Content-Type: application/json');
echo json_encode($matches);

// 接続を閉じる
$stmt->close();
$conn->close();
?>
