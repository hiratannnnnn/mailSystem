<?php
// データベースに接続する
function dbConnect() {
    $servername = "localhost";
    $username = "4451784_database";
    $password = "percyjackson72";
    $dbname = "";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    return $conn;
}

// 選手IDを取得する
function getPlayerIdByName($conn, $name) {
    $stmt = $conn->prepare("SELECT 選手ID FROM 選手情報 WHERE 氏名 = ?");
    $stmt->bind_param("s",$name);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        return $row['選手ID'];
    } else {
        // 選手が存在しない場合の処理（必要に応じて）
        return null;
    }
}

// 選手のIDを取得または作成
function getOrCreatePlayerId($conn, $name, $ruby, $club) {
    $stmt = $conn->prepare("SELECT 選手ID FROM 選手情報 WHERE 氏名 = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        return $row['選手ID'];
    } else {
        $stmt = $conn->prepare("INSERT INTO 選手情報 (氏名, ふりがな, 所属会) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $name, $ruby, $club);
        $stmt->execute();
        return $conn->insert_id;
    }
}

// 既に記録された対戦ではないか確認する
function checkExistingMatch($conn, $memberId, $opponentId, $date, $matchNum) {
    // memberId, opponentId, date, matchNumが一致する行を検索
    $stmt = $conn->prepare("SELECT 対戦ID FROM 対戦情報 WHERE 会員ID = ? AND 対戦者ID = ? AND 日時 = ? AND 回戦 = ?");
    $stmt->bind_param("iiss",$memberId,$opponentId,$date,$matchNum);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        // 条件に一致すr行が存在する場合
        return ['exists' => true, 'matchId' => $row['対戦ID']];
    } else {
        // 条件に一致する行が存在しない場合
        return ['exists' => false];
    }
}

// 上書きする
function updateMatch($conn, $matchId, $date, $location, $matchNum, $result, $number) {
    $stmt = $conn->prepare("UPDATE 対戦情報 SET 日時 = ?, 場所 = ?, 回戦 = ?, 勝敗情報1 = ?, 勝敗情報2 = ? WHERE 対戦ID = ?");
    $stmt->bind_param("ssiiii", $date, $location, $matchNum, $result, $number, $matchId);
    $stmt->execute();
    $stmt->close();
}

// 対戦を登録する
function registerMatch($conn, $date, $location, $matchNum, $memberName, $memberRuby, $memberClub,$opponentName, $opponentRuby, $opponentClub, $result, $number) {
    // 選手IDの取得または作成
    $memberId = getOrCreatePlayerId($conn, $memberName, $memberRuby, $memberClub);
    $opponentId = getOrCreatePlayerId($conn, $opponentName, $opponentRuby, $opponentClub);

    // 同一の対戦が存在するかどうかを確認
    $existingMatch = checkExistingMatch($conn,$memberId,$opponentId,$date,$matchNum);
    if ($existingMatch['exists']) {
        $existingMatchId = $existingMatch['matchId'];
        updateMatch($conn, $existingMatchId, $date, $location, $matchNum, $result, $number);
        registerMatchLog($conn, $memberName, $date, $location);
        $responseMessage = "既に同じ条件の対戦が記録されていたため、{$location} {$matchNum}回戦での{$memberName}と{$opponentName}の対戦を上書きして更新しました。";
        return $responseMessage;
    } else {
        // 対戦情報を登録
        $stmt = $conn->prepare("INSERT INTO 対戦情報 (会員ID, 対戦者ID, 勝敗情報1, 勝敗情報2, 日時, 場所, 回戦) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iiiissi", $memberId, $opponentId, $result, $number, $date, $location,$matchNum);
        $stmt->execute();
        $matchId = $conn->insert_id; // 新しい対戦IDの取得

        // 管理用テーブルに対戦情報を追加（会員）
        $stmt = $conn->prepare("INSERT INTO 管理用 (選手ID, 対戦ID) VALUES (?, ?)");
        $stmt->bind_param("ii", $memberId, $matchId);
        $stmt->execute();

        // 管理用テーブルに対戦情報を追加（対戦者）
        $stmt->bind_param("ii", $opponentId, $matchId);
        $stmt->execute();
        $stmt->close();

        registerMatchLog($conn, $memberName, $date, $location);

        $responseMessage = "{$location} {$matchNum}回戦での{$memberName}と{$opponentName}の対戦を記録しました。";
        return $responseMessage;
    }
}
function registerMatchLog($conn, $memberName, $date, $location) {
    // 出場大会一覧テーブルに情報を追加（会員のみ）
    $memberId = getOrCreatePlayerId($conn, $memberName, '', '慶應かるた会');
    $stmt = $conn->prepare("SELECT COUNT(*) FROM 出場大会一覧 WHERE 選手ID = ? AND 日時 = ?");
    $stmt->bind_param("is",$memberId,$date);
    $stmt->execute();
    $stmt->bind_result($count);
    $stmt->fetch();
    $stmt->close();
    if ($count == 0) {
        $stmt = $conn->prepare("INSERT INTO 出場大会一覧 (選手ID, 日時, 大会名) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $memberId, $date, $location);
        $stmt->execute();
        $stmt->close();
        return 0;
    } else {
        // 既に登録されている場合、その情報を更新
        $stmt = $conn->prepare("UPDATE 出場大会一覧 SET 大会名 = ? WHERE 選手ID = ? AND 日時 = ?");
        $stmt->bind_param("sis", $location, $memberId, $date);
        $stmt->execute();
        $stmt->close();
        return 1;
    }
}
// 大会名を日時から取得
function getTournamentNamesByDate($conn, $date) {
    $tournamentNames = array();
    $stmt = $conn->prepare("SELECT DISTINCT 大会名 FROM 出場大会一覧 WHERE 日時 = ?");
    $stmt->bind_param("s", $date);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $tournamentNames['location'] = $row['大会名'];
    }
    $stmt->close();
    return $tournamentNames;
}
// 大会名から日時と大会名を取得
function getTournamentsByName($conn, $query) {
    $tournaments = array();
    // 大会名でグループ化して最初の日時を取得
    $stmt = $conn->prepare("SELECT 日時, 大会名 FROM 出場大会一覧 WHERE 大会名 LIKE CONCAT('%', ?, '%') GROUP BY 大会名");
    $stmt->bind_param("s", $query);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        if (!array_key_exists($row['大会名'], $tournaments)) {
            $tournaments[$row['大会名']] = array(
                'date' => $row['日時'],
                'location' => $row['大会名']
            );
        }
    }

    $stmt->close();

    // 配列の値だけを取得して返す
    return array_values($tournaments);
}

