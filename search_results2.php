<?php
require_once 'db_functions.php';
// 接続を確立
$conn = dbConnect();

// クエリパラメータから氏名と日付を取得
$name = isset($_GET['name']) ? $_GET['name'] : '';
$date = isset($_GET['date']) ? $_GET['date'] : '';

// 年度の開始と終了を計算
$year = (int)substr($date, 0, 4);
$month = (int)substr($date, 5, 2);

if ($month < 4) {
    // 月が4月より前の場合、年度の開始は前年の4月1日
    $fiscalYearStart = ($year - 1) . '-04-01';
} else {
    // 月が4月以降の場合、年度の開始はその年の4月1日
    $fiscalYearStart = $year . '-04-01';
}
$fiscalYearEnd = $date; // 指定された日付以前

$sql =
"SELECT
日時, 大会名
FROM
出場大会一覧
INNER JOIN 選手情報 ON 出場大会一覧.選手ID = 選手情報.選手ID
WHERE 選手情報.氏名 = ? AND 日時 BETWEEN ? AND ?
ORDER BY 日時 ASC;
";

// SQLステートメントを準備
$stmt = $conn->prepare($sql);

// 検索用語を設定
$searchTerm = urldecode($name);
$stmt->bind_param("sss", $searchTerm, $fiscalYearStart, $fiscalYearEnd);
$stmt->execute();
$result = $stmt->get_result();

// 結果を配列に格納
$matches = [];

while ($row = $result->fetch_assoc()) {
    // 「（非公認）」が含まれる場合はスキップ
    if (strpos($row['大会名'], '（非公認）') !== false) {
        continue;
    }
    $matches[] = [
        'date' => $row['日時'],
        'location' => $row['大会名']
    ];
}

// 結果をJSON形式で出力
header('Content-Type: application/json');
echo json_encode($matches);

// 接続を閉じる
$stmt->close();
$conn->close();
?>
