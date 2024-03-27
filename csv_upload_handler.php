<?php

require_once 'db_functions.php'; // データベース接続関数が定義されたファイルを読み込む

if (isset($_FILES['file'])) {
    $file = $_FILES['file']['tmp_name']; // アップロードされたファイルの一時ファイル名
    $fileName = $_FILES['file']['name'];
    $conn = dbConnect();
    $handle = fopen($file, 'r');
    if ($handle) {
        $count = 2;
        fgetcsv($handle);
        fgetcsv($handle);
        $errorMessages = [];
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            $count++;
            if (empty($data[1])) {
                //$errorMessages[] = "{$count}行目：空欄であると判定し、飛ばしました。";
                continue;
            } else if (empty($data[4])) {
                $errorMessages[] = "{$count}行目：5列目（1か0）がないため、登録できません。";
                continue;
            } else if (empty($data[10])) {
                $errorMessages[] = "{$count}行目：11列目（日時）がないため、登録できません。";
                continue;
            } else if (empty($data[12])) {
                $errorMessages[] = "{$count}行目：13列目（〇回戦か）がないため、登録できません。";
                continue;
            }
            
            $memberName = $data[1] . " ". $data[2];
            $memberClub = $data[0] === "" ? "慶應かるた会" : $data[0];
            $opponentName = $data[7] . " " . $data[8];
            $date_obj = date_create($data[10]);
            $date_form = date_format($date_obj,"Y-m-d");
            $sameMatch = registerMatch($conn, $date_form, $data[11], $data[12], $memberName, $data[3], $memberClub, $opponentName, $data[9], $data[6], $data[4], $data[5]);
            if(!strpos($sameMatch,"記録")){
                echo "csvの" . $count . "行目" . $sameMatch;
            }
        }
        fclose($handle);
        $conn->close();
        // エラーメッセージの表示
        if (!empty($errorMessages)) {
            echo "{$fileName}の処理中に以下のエラーが発生しました。修正した上で再びアップロードしてください。\n";
            foreach ($errorMessages as $message) {
                echo $message."\n";
            }
        } else {
            echo "{$fileName}の処理が完了しました。";
        }
    } else {
        echo "ファイルを開くことができませんでした。";
    }
} else {
    echo "ファイルがアップロードされていません。";
}
