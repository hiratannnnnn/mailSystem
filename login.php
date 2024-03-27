<?php
// login.php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $passphrase = $_POST['passphrase'];
    
    // ここで合言葉を検証
    if ($passphrase === "ゆずりん") { // ここに実際の合言葉を設定
        echo "success";
    } else {
        echo "failure";
    }
} else {
    // POST以外のリクエストに対する処理
    echo "Invalid request";
}
?>