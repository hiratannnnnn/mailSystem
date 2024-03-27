<!DOCTYPE html>
<html>
<head>
    <title>慶應かるた会　記録データベース</title>
    <style>
    body {
        background-color: #e8f5e9; /* 背景色を薄い緑色に設定 */
        text-align: center; /* テキストを中央揃えに */
    }

    .hidden {
        display: none;
    }

    .flex-container {
        display: flex;
        justify-content: space-between;
        padding: 20px
    }

    .flex-item {
    }

    .left-section {
        flex: 1;
        text-align: center;
    }

    .right-section {
        padding: 10px;
        flex: 3;
    }
    .title-section {
        text-align: center;
        flex: 1
        padding: 30px;
    }

    .text {
      text-align: left;
    }

    .login-section {
        display: flex;
        padding: 30px;
    }

    #search-results {
        text-align: center;
        overflow-x: auto;
    }

    #results-table {
        margin: 0 auto;
        border-collapse: collapse;
        width: 100%;
        max-width: 800px;
    }

    #results-table2 {
        margin: 0 auto;
        border-collapse: collapse;
        width: 90%;
        max-width: 700px;
    }

    th,td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    th {
        background-color: #4CAF50;
        color: white;
    }

    #results-table th:nth-child(1), #results-table td:nth-child(1) { width: 17%; } /* 日時 */
    #results-table th:nth-child(2), #results-table td:nth-child(2) { width: 23%; } /* 所属会 */
    #results-table th:nth-child(3), #results-table td:nth-child(3) { width: 17%; } /* 氏名 */
    #results-table th:nth-child(4), #results-table td:nth-child(4) { width: 5%; } /* 勝敗 */
    #results-table th:nth-child(5), #results-table td:nth-child(5) { width: 5%; } /* 枚数 */
    #results-table th:nth-child(6), #results-table td:nth-child(6) { width: 33%; } /* 場所 */

	#results-table2 th:nth-child(1), #results-table2 td:nth-child(1) { width: 40%; }
    #results-table2 th:nth-child(2), #results-table2 td:nth-child(2) { width: 60%; }
            
    .modal {
        display: none; /* 最初は非表示 */
        position: fixed; /* 画面上に固定 */
        z-index: 1; /* 他の要素の上に表示 */
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto; /* スクロールバーを有効に */
        background-color: rgba(0, 0, 0, 0.4); /* 背景色を半透明の黒に */
    }

    .modal-content {
        background-color: #f0f5f1; /* 落ち着いた緑系の色調 */
        text-align: center;
        margin: 10% auto; /* 画面中央に配置 */
        padding: 20px;
        border: 1px solid #000; /* ボーダーを黒色に */
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2); /* ソフトな影を追加 */
        width: 50%; /* 幅を調整 */
        border-radius: 10px; /* 角を丸く */
    }

    #loading-spinner {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        color: #4CAF50;
        display: none;
    }

    @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg);}
    }

    @media screen and (max-width: 600px) {
      .flex-container {
        display: flex;
        flex-direction: column;
      }

      .flex-item{
        width: 100%;
        margin: 0;
        padding: 10px;
      }

      body {
        font-size: 24px;
      }
    }

    .close {
        color: #aaaaaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
    }

    .close:hover,
    .close:focus {
        color: #000;
        text-decoration: none;
        cursor: pointer;
    }

    /* ボタンとフォーム要素のスタイルを更新 */
    button, input[type="text"], input[type="password"] {
        padding: 10px;
        margin: 5px 0;
        border: 1px solid #000; /* ボーダーを黒色に */
        border-radius: 5px;
        outline: none;
        font-size: 16px;
    }

    button {
        background-color: #8bc34a; /* ボタンの背景色を緑に */
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    button:hover {
        background-color: #7cb342; /* ホバー時の色を変更 */
    }

    .delete-button {
      background-color: #ff7961; /* 赤色 */
      color: white;
      padding: 10px 10px;
      margin-right: 40px; /* 更新ボタンから左に40pxの間隔 */
      margin-left: 40px;
      border: none;
      cursor: pointer;
      transition: opacity 0.3s ease;
    }
    .delete-button:hover {
      opacity: 0.8;
    }
</style>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      document.getElementById("login-button").addEventListener("click", function() {
        var passphrase = document.getElementById("passphrase").value;
        // Fetch APIを使用してサーバーサイドに合言葉を送信
        fetch('login.php', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'passphrase=' + encodeURIComponent(passphrase)
        })
        .then(response => response.text())
        .then(response => {
          if(response === "success") {
              document.getElementById("login-section").classList.add("hidden");
              document.getElementById("main-content").classList.remove("hidden");
              document.getElementById("title-section").classList.remove("hidden");
              document.getElementById("table-section").classList.remove("hidden");
              document.getElementById('table-section2').classList.remove('hidden');
          } else {
              alert("ログイン失敗");
          }
        });
      });
    });
  </script>
</head>
<body>
  <!-- ログインセクション 整備済み -->
  <div id="login-section">
      <h1>慶應かるた会<br>記録データベース</h1>
      <p>ログインしてください。</p>
      
      <!-- ユーザー名とパスワードの入力フォームを合言葉の入力に変更 -->
      <label for="passphrase">合言葉:</label><br>
      <input type="text" id="passphrase" name="passphrase"><br>
      <button type="button" id="login-button">ログイン</button>
  </div>
  <div id="title-section" class="title-section hidden">
  <h1>慶應かるた会</h1>
          <h2>記録データベース</h2>
          <p>
            記録用データベースです。<br>
            1試合ごとに結果を記録します。自動的に出場した大会の記録も埋まります。
          </p>

          <button id="open-modal">対戦を記録する</button>
          <br><br><br><hr><br>
  </div>
  <div class="flex-container">
    
    <!-- 右側のセクション (ログインセクションとメンバー記録の検索) -->
    <div class="flex-item right-section">      
      
      <div id="table-section2" class="hidden">
        <h2>出場扱いの大会を検索</h2>
        <p class="text">ある大会に出場した（または出場扱いになった）という記録のみ見れます。A～C級の公認大会の出場回数のカウントにご利用ください。<br>
        カウントするのは、<b>申込開始日までの</b>公認大会出場回数です。
        </p>
        <form id="search-form2">
            <label for="date2">申込開始日: </label>
            <input type="date" id="date2" name="date2"><br>
            <label for="search-name2">人名で検索: </label>
            <input type="text" id="search-name2" name="search-name2" placeholder="検索...">
            <button type="button" id="search-button2">検索</button><button type="button" id="delete-search-results2" class="delete-button">クリア</button>
            <div id="loading-spinner7" class="hidden">検索中…</div>
            <div id="suggestion-box2"></div>
        </form>
        <div id="search-results2">
          <table id="results-table2">
            <thead>
              <tr>
                <th>日時</th>
                <th>大会名</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
          <div id="loading-spinner8" class="hidden">検索中...（時間がかかることがあります。）</div>
          <button type="button" id="default-button" class="hidden">出場した（扱いになった）大会を新規追加</button>
        </div>
        <br><br><br><hr><br>
      </div>
      <div id="table-section" class="hidden">
        <h2>対戦結果検索</h2>
        <p class="text">登録されている場合は、名前の一部を2文字以上入れて少し待つとサジェストが出るので、そこをクリックして名前を入力してください。サジェストは漢字とふりがな両対応ですが、ふりがなは登録されていない場合があります。</p>
        <p class="text">間違っていると思われるところがある場合は、その部分をクリックすると、修正できます。</p>
        <form id="search-form">
            <label for="search-name">人名で検索:</label>
            <input type="text" id="search-name" name="search-name" placeholder="検索...">
            <button type="button" id="search-button">検索</button><button type="button" id="delete-search-results" class="delete-button">クリア</button>
            <div id="loading-spinner5" class="hidden">検索中…</div>
            <div id="suggestion-box"></div>
        </form>
        <div id="search-results">
          <table id="results-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>所属会</th>
                <th>氏名</th>
                <th>勝敗</th>
                <th>枚数</th>
                <th>場所</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
          <div id="loading-spinner6" class="hidden">検索中…（時間がかかることがあります。）</div>
          <p class="text">対戦相手の名前で検索した場合は、勝敗は対戦相手視点になります。（慶應かるた会から見たら逆）</p>
        </div>
        <br><br><br><hr><br>
      </div>
    </div>
    <!-- 左側のセクション (情報登録フォーム) -->
    <div class="flex-item left-section">
        <!-- メインコンテンツ（初期状態では非表示） -->
        <div id="main-content" class="hidden">
          <div id="modal" class="modal">
              <div class="modal-content">
                  <span class="close">&times;</span>
                  <h2>情報登録フォーム</h2>
                  <form id="registration-form" action="business_logic.php" method="POST">
                      <label for="date">*日時:</label>
                      <input type="date" id="date" name="date"><br>

                      <label for="location">大会名:</label>
                      <input type="text" id="location" name="location"><br>
                      <div id="loading-spinner9" class="hidden">検索中...</div>
                      <div id="location-suggestion-box"></div>
                      <input type="number" id="matchNum" name="matchNum" min="1" max="50"><label for="matchNum">試合目（同じ日のうち）</label>
                      <br>
                      <label for="member-name">*会員氏名:</label><br>
                      <input type="text" id="member-name" name="member-name"><br>
                      <div id="loading-spinner3" class="hidden">検索中...</div>
                      <div id="member-suggestion-box"></div>

                      <label for="member-ruby">ふりがな:</label><br>
                      <input type="text" id="member-ruby" name="member-ruby"><br>
                      <label for="member-club">所属会:</label><br>
                      <input type="text" id="member-club" name="member-club"><br>
                      <br>
                      <label for="opponent-name">対戦相手氏名:（不戦勝は空欄）</label><br>
                      <input type="text" id="opponent-name" name="opponent-name"><br>
                      <div id="loading-spinner4" class="hidden">検索中...</div>
                      <div id="opponent-suggestion-box"></div>

                      <label for="opponent-ruby">ふりがな:</label><br>
                      <input type="text" id="opponent-ruby" name="opponent-ruby"><br>

                      <label for="opponent-club">対戦相手所属会:</label>
                      <input type="text" id="opponent-club" name="opponent-club"><br>

                      <label for="result1">*会員（上の人）から見た勝敗 (0→負け 1→勝ち):</label>
                      <input type="number" id="result1" name="result1" min="0" max="1"><br>

                      <label for="result2">枚数:</label>
                      <input type="number" id="result2" name="result2" min="0" max="50"><br>

                      <button type="submit">登録</button>
                  </form>
              </div>
          </div>
          <div id="edit-modal" class="modal">
            <div class="modal-content">
              <span class="close">&times;</span>
              <h2>修正</h2>
              <form id="edit-form" action="update_match.php" method="POST">
                <label for="edit-date">*日時 (YYYY-MM-DD):</label>
                <input type="date" id="edit-date" name="edit-date"><br>

                <label for="edit-location">大会名:</label>
                <input type="text" id="edit-location" name="edit-location"><br>
                <input type="number" id="edit-matchNum" name="edit-matchNum" min="1" max="50"><label for="edit-matchNum">試合目（同じ日のうち）</label><br>

                <label for="edit-member-name">*会員氏名:</label>
                <input type="text" id="edit-member-name" name="edit-member-name"><br>

                <label for="edit-member-ruby">ふりがな:</label>
                <input type="text" id="edit-member-ruby" name="edit-member-ruby"><br>
                <label for="edit-member-club">会員所属会</label>
                <input type="text" id="edit-member-club" name="edit-member-club"><br>

                <label for="edit-opponent-name">対戦相手氏名:（不戦勝は空欄）</label>
                <input type="text" id="edit-opponent-name" name="edit-opponent-name"><br>

                <label for="edit-opponent-ruby">ふりがな:</label>
                <input type="text" id="edit-opponent-ruby" name="edit-opponent-ruby"><br>

                <label for="edit-opponent-club">対戦相手所属会:</label>
                <input type="text" id="edit-opponent-club" name="edit-opponent-club"><br>

                <label for="edit-result1">*会員（上の人）から見た勝敗 (0→負け 1→勝ち):</label>
                <input type="number" id="edit-result1" name="result" min="0" max="1"><br>

                <label for="edit-result2">枚数:</label>
                <input type="number" id="edit-result2" name="number" min="0" max="50"><br>
                <div id="matchId" name="matchId" class="hidden"></div><div id="flag" name="flag" class="hidden"></div>
                <div>
                  <button type="button" id="delete-button" class="delete-button" data-match-id="対戦ID">削除</button>
                  <button type="submit" class="update-button">更新</button>
                </div>
              </form>
            </div>
          </div>
          <div id="modal3" class="modal">
            <div class="modal-content">
              <span class="close">&times;</span>
              <h2>出場大会記録</h2>
              <form id="match-form" action="register.php" method="POST">
                <label for="register-name">氏名</label>
                <input type="text" id="register-name" name="register-name"><br>
                      
                <label for="register-date">大会日時</label>
                <input type="date" id="register-date" name="register-date"><br>

                <label for="register-location">大会名</label>
                <input type="text" id="register-location" name="register-location"><br>

                <br>
                <p class="text">出場した大会を登録します。以下の基準に注意してください。<br>
                「抽選に通った後にキャンセルした」場合は出場扱い<br>
                「キャンセル繰上りを断った」場合は出場扱いではない<br>
                「その他公共交通機関の乱れや台風などの災害による棄権」は出場扱いではない
                </p>
                <br>
                <div>
                  <button type="button" id="delete-button3" class="delete-button">削除</button>
                  <button type="submit" class="register-button">登録</button>
                </div>
              </form>
            </div>
          </div>
          <h3>大会の結果などをまとめて記録する↓↓</h3>
          <p class="text">
            主に大会の記録に使います。例の部分は残し、3行目から記載してください。<br>※スマホ非推奨
          </p>
          <a href="https://drive.google.com/uc?export=download&id=14dIrgNDDCkOHJYShJ_TRNDk6vC_6ZyHM" download="大会記録＿サンプル.csv">大会記録＿サンプル</a><br><br>
          <input type="file" id="register-input">
          <button type="button" id="upload-button2">アップロード</button>
          <div id="loading-spinner1" class="hidden">現在アップロード中です。</div>
          <br><br><br><hr><br>
          <p class="text">慶應かるた会内を想定して作られましたが、慶應かるた会ではない人を登録することもできます。</p>
          <br><hr><br>
          <div id="error-message"></div>
        </div>
    </div>

  </div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      let timer;
      // モーダルを表示するボタン
      var modalBtn = document.getElementById('open-modal');
      // モーダル本体
      var modal = document.getElementById('modal');
      // モーダルを閉じるクローズボタン
      var closeBtn = document.getElementsByClassName('close')[0];
      // フォーム
      var form = document.getElementById('registration-form');
      // 修正フォームモーダル
      var modal2 = document.getElementById('edit-modal');
      // 修正フォームクローズボタン
      var closeBtn2 = document.getElementsByClassName('close')[1];
      // 修正フォーム
      var editForm = document.getElementById('edit-form');
      // csvをアップロードするボタン
      var csvUpload = document.getElementById('upload-button2');
      // csvのエラーメッセージ
      var errorMessage = document.getElementById('error-message');
      // 検索内容（メイン）
      var searchInput = document.getElementById('search-name');
      // 申込開始日
      var date2Input = document.getElementById('date2');
      // 検索内容（出場大会）
      var searchInput2 = document.getElementById('search-name2');
      // 日時
      var dateInput = document.getElementById('date');
      // 大会名
      var locationInput = document.getElementById('location');
      // 検索（情報登録フォーム、会員）
      var memberSearchInput = document.getElementById('member-name');
      // ふりがな
      var memberRubyInput = document.getElementById('member-ruby');
      // 所属会
      var memberClubInput = document.getElementById('member-club');
      // 検索（情報登録フォーム、対戦者）
      var opponentSearchInput = document.getElementById('opponent-name');
      // ふりがな
      var opponentRubyInput = document.getElementById('opponent-ruby');
      // 所属会
      var opponentClubInput = document.getElementById('opponent-club');
      // 検索結果表示（メイン）
      var suggestionBox = document.getElementById('suggestion-box');
      // 検索結果表示（出場大会）
      var suggestionBox2 = document.getElementById('suggestion-box2');
      // 検索結果表示（情報登録フォーム、会員）
      var memberSuggestionBox = document.getElementById('member-suggestion-box');
      // 検索結果表示（情報登録フォーム、対戦者）
      var opponentSuggestionBox = document.getElementById('opponent-suggestion-box');
      // 検索結果表示（情報登録フォーム、日時、大会名）
      var locationSuggestionBox = document.getElementById('location-suggestion-box');
      // スピナー（メイン）
      var loadingSpinner5 = document.getElementById("loading-spinner5");
      // スピナー（対戦記録表示ボックス）
      var loadingSpinner6 = document.getElementById('loading-spinner6');
      // スピナー（情報登録フォームサジェスト、会員）
      var loadingSpinner3 = document.getElementById('loading-spinner3');
      // スピナー（情報登録フォームサジェスト、対戦者）
      var loadingSpinner4 = document.getElementById('loading-spinner4');
      // スピナー（情報登録フォームサジェスト、日時、大会名）
      var loadingSpinner9 = document.getElementById('loading-spinner9');
      // スピナー（出場大会検索）
      var loadingSpinner7 = document.getElementById('loading-spinner7');
      // スピナー（出場大会検索、メイン）
      var loadingSpinner8 = document.getElementById('loading-spinner8');
      // 検索ボタン
      var searchButton = document.getElementById('search-button');
      // 検索ボタン（出場大会）
      var searchButton2 = document.getElementById('search-button2');
      // 検索結果表示（対戦記録）
      var resultsTable = document.getElementById('results-table');
      // 検索結果表示（出場大会）
      var resultsTable2 = document.getElementById('results-table2');
      // 削除ボタン
      var deleteButton = document.getElementById('delete-button');
      // 削除ボタン（出場大会）
      var deleteButton3 = document.getElementById('delete-button3');
      // 検索結果削除ボタン
      var deleteResultsButton = document.getElementById('delete-search-results');
      // 検索結果削除ボタン（出場大会）
      var deleteResultsButton2 = document.getElementById('delete-search-results2');
      // 出場大会登録モーダル
      var modal3 = document.getElementById('modal3');
      // 閉じるボタン
      var closeBtn3 = document.getElementsByClassName('close')[2];
      // 出場大会登録フォーム
      var matchForm = document.getElementById('match-form');
      // 登録フォームボタン
      var defaultButton = document.getElementById('default-button');
      

     // ボタンクリックでモーダルを表示
      modalBtn.onclick = function() {
          modal.style.display = "block";
      };

      // クローズボタンクリックでモーダルを非表示
      closeBtn.onclick = function() {
          modal.style.display = "none";
      };

      // モーダル外の領域クリックでモーダルを非表示
      window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = "none";
        } else if (event.target == modal3) {
          modal3.style.display = "none";
        }
      };
      
      // 出場大会フォーム閉じるボタン
      closeBtn3.onclick = function() {
          modal3.style.display = "none";
      }

      // 情報登録
      form.addEventListener('submit', function(e) {
          e.preventDefault(); // フォームのデフォルト送信を防止
          var memberName = document.getElementById('member-name').value;
          var opponentName = document.getElementById('opponent-name').value;
          var result = document.getElementById('result1').value;
          var date = document.getElementById('date').value;
          var matchNum = document.getElementById('matchNum').value;            
          // 必須情報のチェック
          if (!memberName || !result || !date || !matchNum) {
              alert('自分の氏名、勝敗、日時、何回戦かは必須の情報です。');
              return; // ここで処理を中断
          }
          if ((!memberName.trim().includes(" ") && !memberName.trim().includes("　")) || ((opponentName !== "" && opponentName !== " ") && (!opponentName.trim().includes(" ") && !opponentName.trim().includes("　")))) {
              alert('名字と下の名前の間に空白を含めてください。');
              return; // 処理を中断
          }
          
          // FormDataオブジェクトを作成
          var formData = new FormData(form);

          // Ajaxでフォームデータをサーバーに送信
          fetch('business_logic.php', {
              method: 'POST',
              body: formData
          })
          .then(response => response.text())
          .then(data => {
              alert(data); // サーバーからの応答をアラートで表示
              modal.style.display = 'none'; // モーダルを閉じる
              searchButton.click();
          })
          .catch(error => console.error('Error:', error));
      });
      editForm.addEventListener('submit', function(e){
        e.preventDefault();
        // 入力値の取得
        var date = document.getElementById('edit-date').value;
        var matchNum = document.getElementById('edit-matchNum').value;
        var memberName = document.getElementById('edit-member-name').value;
        var opponentName = document.getElementById('edit-opponent-name').value;
        var result1 = document.getElementById('edit-result1').value;
        var matchId = document.getElementById('matchId').innerHTML;
        var flag = document.getElementById('flag').innerHTML;

        if (!date || !matchNum || !memberName || result1 === "") {
          alert("日時、試合目、会員氏名、勝敗は必須項目です。入力してください。");
          return; // 処理を中断
        }
        if ((!memberName.trim().includes(" ") && !memberName.trim().includes("　")) || ((opponentName !== "" && opponentName !== " ") && (!opponentName.trim().includes(" ") && !opponentName.trim().includes("　")))) {
          alert('名字と下の名前の間に空白を含めてください。');
          return; // 処理を中断
        }

        // FormDataオブジェクトの作成とフィールドの追加
        var formData = new FormData(editForm);
        formData.append('matchId',matchId);
        fetch('update_match.php', { // サーバーサイドの処理を行うPHPファイル
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            alert(data); // 更新完了の通知
            modal2.style.display = "none";
            searchButton.click();
        })
        .catch(error => console.error('Error:', error));
      });
      // 出場大会
      matchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = document.getElementById('register-name');
        var date = document.getElementById('register-date');
        var location = document.getElementById('register-location');
        if (!name || !date || !location) {
          alert("氏名、日時、大会名のすべてが必須事項です。");
          return;
        }
        var formData = new FormData(matchForm);
        fetch('register_match.php', {
          method: 'POST',
          body: formData
        })
        .then(response => response.text())
        .then(data => {
          alert(data);
          modal3.style.display = "none";
          searchButton2.click();
        })
        .catch(error => console.error('Error:', error));
      });
      //csv
      csvUpload.addEventListener('click', function() {
        var fileInput = document.getElementById('register-input');
        var loadingSpinner = document.getElementById('loading-spinner1');
        errorMessage.innerHTML = '';

        if (!fileInput.files.length) {
            alert('ファイルが選択されていません。');
            return;
        }

        // ローディングスピナーを表示
        loadingSpinner.classList.remove('hidden');

        var formData = new FormData();
        formData.append('file', fileInput.files[0]);

        // Ajaxでファイルをサーバーに送信
        fetch('csv_upload_handler.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            alert(data); // サーバーからの応答をアラートで表示
            // アップロード完了後にローディングスピナーを非表示にする
            loadingSpinner.classList.add('hidden');
            data = data.replace(/\n/g,"<br>");
            errorMessage.innerHTML = data;
            fileInput.value = '';
        })
        .catch(error => {
            console.error('Error:', error);
            // エラー発生時もローディングスピナーを非表示にする
            loadingSpinner.classList.add('hidden');

        });
      });
      // サジェストのEnterキー防止
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
      // 情報登録フォームサジェスト、大会名
      locationInput.addEventListener('input', function() {
        if (locationInput.value.length >= 2) {
          loadingSpinner9.classList.remove("hidden");
          clearTimeout(timer);
          timer = setTimeout(function() {
            fetch(`/search_match.php?query=${encodeURIComponent(locationInput.value)}`)
              .then(response => response.json())
              .then(response => {
                locationSuggestionBox.innerHTML = ''; // サジェストボックスをクリア
                loadingSpinner9.classList.add("hidden");
                if (response.status === 'success' && response.type === 'string') {
                  response.data.forEach(item => {
                    const div = document.createElement('div');
                    // 日時と大会名の情報を表示
                    div.textContent = [item.date, item.location].join(', ');
                    div.addEventListener('click', function() {
                      // divをクリックした際の処理
                      dateInput.value = item.date; // dateInputに日時をセット
                      locationInput.value = item.location; // locationInputに大会名をセット
                      locationSuggestionBox.innerHTML = '';
                    });
                    locationSuggestionBox.appendChild(div);
                  });
                }
              })
              .catch(error => {
                console.error("Error:", error);
                loadingSpinner9.classList.add("hidden");
              });
          }, 300);
        }
      });
      // 情報登録フォームサジェスト、日時
      dateInput.addEventListener('change', function() {
        if (dateInput.value) {
          loadingSpinner9.classList.remove("hidden");
          fetch(`/search_match.php?query=${encodeURIComponent(dateInput.value)}`)
            .then(response => response.json())
            .then(response => {
              locationSuggestionBox.innerHTML = ''; // サジェストボックスをクリア
              loadingSpinner9.classList.add("hidden");
              if (response.status === 'success' && response.type === 'date') {
                if (response.data.length === 1) {
                  // response.dataの内容物が一つだけの場合
                  locationInput.value = response.data[0]; // locationInputに大会名をセット
                } else if (response.data.length > 1) {
                  // response.dataの内容物が2つ以上の場合
                  response.data.forEach(item => {
                    const div = document.createElement('div');
                    // dateとlocationの情報を表示;
                    div.textContent = [dateInput.value, item].join(', ');
                    div.addEventListener('click', function() {
                      // divをクリックした際の処理
                      locationInput.value = item; // locationInputに大会名をセット
                      locationSuggestionBox.innerHTML = '';
                    });
                    locationSuggestionBox.appendChild(div);
                  });
                }
              }
            })
            .catch(error => {
              console.error("Error:", error);
              loadingSpinner9.classList.add("hidden");
            });
        }
      });

      // 情報登録フォームサジェスト、会員
      memberSearchInput.addEventListener('input', function() {
        if (memberSearchInput.value.length >= 2) {
          loadingSpinner3.classList.remove("hidden");
          clearTimeout(timer);
          timer = setTimeout(function() {
            fetch(`/search.php?query=${encodeURIComponent(memberSearchInput.value)}`)
              .then(response => response.json())
              .then(data => {
                memberSuggestionBox.innerHTML = '';
                data.forEach(item => {
                  const div = document.createElement('div');
                  div.textContent = [item.name, item.ruby, item.club].join(", ");
                  div.addEventListener('click', function() {
                    memberSearchInput.value = item.name;
                    memberRubyInput.value = item.ruby;
                    memberClubInput.value = item.club;
                    memberSuggestionBox.style.display = "none";
                  });
                  memberSuggestionBox.appendChild(div);
                  memberSuggestionBox.style.display = "block";
                });
                loadingSpinner3.classList.add("hidden");
              })
              .catch(error => {
                console.error("Error:", error);
                loadingSpinner3.classList.add("hidden");
              });
          }, 300);
        }
      });
      // 情報登録フォームサジェスト、対戦者
      opponentSearchInput.addEventListener('input', function() {
        // スピナーを表示
        if (opponentSearchInput.value.length >= 2) {
          loadingSpinner4.classList.remove("hidden");
          clearTimeout(timer);
          timer = setTimeout(function() {
            fetch(`/search.php?query=${encodeURIComponent(opponentSearchInput.value)}`)
              .then(response => response.json())
              .then(data => {
                opponentSuggestionBox.innerHTML = '';
                data.forEach(item => {
                  const div = document.createElement('div');
                  div.textContent = [item.name, item.ruby, item.club].join(", ");
                  div.addEventListener('click', function() {
                    opponentSearchInput.value = item.name;
                    opponentRubyInput.value = item.ruby;
                    opponentClubInput.value = item.club;
                    opponentSuggestionBox.style.display = "none";
                  });
                  opponentSuggestionBox.appendChild(div);
                  opponentSuggestionBox.style.display = "block";
                });
                loadingSpinner4.classList.add("hidden");
              })
              .catch(error => {
                console.error("Error:", error);
                loadingSpinner4.classList.add("hidden");
              });
          }, 300);
        }
      });
      // 検索文字列、サジェスト
      searchInput.addEventListener('input', function() {
        // スピナーを表示
        if (searchInput.value.length >= 2) {
          loadingSpinner5.classList.remove("hidden");
          clearTimeout(timer);
          timer = setTimeout(function() {
            // ここでサーバーにリクエストを送信し、候補を取得
            fetch(`/search.php?query=${encodeURIComponent(searchInput.value)}`)
              .then(response => response.json())
              .then(data => {
                suggestionBox.innerHTML = '';
                data.forEach(item => {
                  const div = document.createElement('div');
                  div.textContent = [item.name,item.ruby,item.club].join(", ");
                  div.addEventListener('click',function() {
                    searchInput.value = item.name;
                    suggestionBox.style.display = 'none';
                  });
                  suggestionBox.appendChild(div);
                  suggestionBox.style.display = 'block';
                });
                loadingSpinner5.classList.add("hidden");
              })
              .catch(error => {
                console.error('Error:',error);
                loadingSpinner5.classList.add("hidden");
              });
          }, 300);
        } // でバウンス時間：300ms
      });
      // 検索ボタン（対戦記録）
      searchButton.addEventListener('click', function() {
        loadingSpinner6.classList.remove('hidden');
        resultsTable.innerHTML = '';
        if(searchInput.value === '') {
          alert('検索文字列が入力されていません。');
          return;
        }

        fetch(`/search_results.php?name=${encodeURIComponent(searchInput.value)}`)
          .then(response => response.json())
          .then(data => {
            data.forEach(match => {
              var row = resultsTable.insertRow();
              row.insertCell(0).textContent = match.date;
              row.insertCell(1).textContent = match.flag === 0 ? match.opponentClub : "慶應かるた会";
              row.insertCell(2).textContent = match.flag === 0 ? match.opponentName : match.memberName;
              row.insertCell(3).textContent = match.flag === 0 ? match.result === 0 ? "✕" : "〇" : match.result === 0 ? "〇": "✕";
              row.insertCell(4).textContent = match.number === 0 ? '' : match.number;
              var location = match.location;
              var matchNum = match.matchNum;
              location = location + " " + matchNum + "回戦";
              row.insertCell(5).textContent = location;


              row.addEventListener('click', () => openEditModal(match));
            });
            loadingSpinner6.classList.add('hidden');
          })
          .catch(error => {
            console.error('Error:', error);
            loadingSpinner6.classList.add('hidden');
          });
      });
      deleteButton.addEventListener('click', function() {
        var matchId = document.getElementById('matchId').innerHTML;
        var date = document.getElementById('edit-date').value;
        var location = document.getElementById('edit-location').value;
        var matchNum = document.getElementById('edit-matchNum').value;
        var memberName = document.getElementById('edit-member-name').value;
        var opponentName = document.getElementById('edit-opponent-name').value;
        var confirmDelete = confirm(date + " " + location + " " + matchNum + "回戦の" + memberName + " と " + opponentName + "の対戦を削除しますが、よろしいですか？");
        if(confirmDelete) {
          console.log('削除処理', matchId);
          fetch(`delete_match.php?matchId=${encodeURIComponent(matchId)}`,{
          method: 'GET'
          })
          .then(response => response.json())
          .then(data => {
            if(data.success) {
              alert('対戦情報が削除されました。');
            } else {
              alert('対戦情報の削除に失敗しました。');
            }
            modal2.style.display = "none";
            searchButton.click();
          })
          .catch(error => {
            console.error('Error:', error);
            modal2.style.display = "none";
          });
        }
      });
      deleteResultsButton.addEventListener('click',function() {
        resultsTable.innerHTML = '';
      });
      searchInput2.addEventListener('keydown', function(e) {
        if(e.key === 'Enter') {
          e.preventDefault();
        }
      });
      searchInput2.addEventListener('input', function() {
        // スピナーを表示
        if (searchInput2.value.length >= 2) {
          loadingSpinner7.classList.remove("hidden");
          clearTimeout(timer);
          timer = setTimeout(function() {
            // ここでサーバーにリクエストを送信し、候補を取得
            fetch(`/search.php?query=${encodeURIComponent(searchInput2.value)}`)
              .then(response => response.json())
              .then(data => {
                suggestionBox2.innerHTML = '';
                data.forEach(item => {
                  const div = document.createElement('div');
                  div.textContent = [item.name,item.ruby,item.club].join(", ");
                  div.addEventListener('click',function() {
                    searchInput2.value = item.name;
                    suggestionBox2.style.display = 'none';
                  });
                  suggestionBox2.appendChild(div);
                  suggestionBox2.style.display = 'block';
                });
                loadingSpinner7.classList.add("hidden");
              })
              .catch(error => {
                console.error('Error:',error);
                loadingSpinner7.classList.add("hidden");
              });
          }, 300);
        } // でバウンス時間：300ms
      });
      // 出場大会
      searchButton2.addEventListener('click', function() {
        loadingSpinner8.classList.remove('hidden');
        resultsTable2.innerHTML = '';
        if(searchInput2.value === '' || date2Input.value === '') {
          alert('申込開始日、または氏名が入力されていません。');
          return;
        } else if (!searchInput2.value.trim().includes(" ") && !searchInput2.value.trim().includes("　")) {
          alert('名字と下の名前の間にスペースを含めてください。')
        }
        const encodedName = encodeURIComponent(searchInput2.value);
    	  const encodedDate = encodeURIComponent(date2Input.value);
        fetch(`/search_results2.php?name=${encodedName}&date=${encodedDate}`)
          .then(response => response.json())
          .then(data => {
            data.forEach(match => {
              var row = resultsTable2.insertRow();
              row.insertCell(0).textContent = match.date;
              row.insertCell(1).textContent = match.location;
              row.addEventListener('click', () => openEditModal2(searchInput2.value,match));
            });
            defaultButton.classList.remove('hidden');
            loadingSpinner8.classList.add('hidden');
          })
          .catch(error => {
            console.error('Error:', error);
            loadingSpinner8.classList.add('hidden');
          });
      });
      deleteButton3.addEventListener('click', function() {
        var name = document.getElementById('register-name').value;
        var date = document.getElementById('register-date').value;
        var fetchData = [name,date].join(",");
        var confirmDelete = confirm(date + "の記録を削除しますが、よろしいですか？");
        if(confirmDelete) {
          fetch(`delete_match_log.php?data=${encodeURIComponent(fetchData)}`,{
          method: 'GET'
          })
          .then(response => response.json())
          .then(data => {
            if(data.success) {
              alert('履歴が削除されました。');
            } else {
              alert('履歴の削除に失敗しました。');
            }
            modal3.style.display = "none";
            searchButton2.click();
          })
          .catch(error => {
            console.error('Error:', error);
            modal3.style.display = "none";
          });
        }
      });
      defaultButton.addEventListener('click', function() {
        var registerName = document.getElementById('register-name');
        registerName.value = searchInput2.value;
        modal3.style.display = 'block';
      });
      deleteResultsButton2.addEventListener('click', function() {
        resultsTable2.innerHTML = '';
      });
    });
    // 検索結果ボックスでクリックされると表示
    function openEditModal(matchData) {
      // モーダル内のフォーム要素にデータをセット
      document.getElementById('edit-date').value = matchData.date;
      document.getElementById('edit-location').value = matchData.location;
      document.getElementById('edit-matchNum').value = matchData.matchNum;
      document.getElementById('edit-member-name').value = matchData.memberName;
      document.getElementById('edit-member-ruby').value = matchData.memberRuby;
      document.getElementById('edit-member-club').value = matchData.memberClub;
      document.getElementById('edit-opponent-name').value = matchData.opponentName;
      document.getElementById('edit-opponent-ruby').value = matchData.opponentRuby;
      document.getElementById('edit-opponent-club').value = matchData.opponentClub;
      document.getElementById('edit-result1').value = matchData.result;
      document.getElementById('edit-result2').value = matchData.number; // あとで直す
      document.getElementById('matchId').innerHTML = matchData.matchId;
      document.getElementById('flag').innerHTML = matchData.flag;
      var modal2 = document.getElementById('edit-modal');
      modal2.style.display = 'block';

      // クローズボタンの動作を設定
      var closeButton = modal2.querySelector('.close');
      closeButton.onclick = function() {
        modal2.style.display = 'none';
      }

      // モーダル外クリックでモーダルを閉じる動作を設定
      window.onclick = function(event) {
        if (event.target == modal2) {
          modal2.style.display = 'none';
        }
      }
    }
    function openEditModal2(name,matchData) {
      var modal3 = document.getElementById('modal3');
      document.getElementById('register-name').value = name;
      document.getElementById('register-date').value = matchData.date;
      document.getElementById('register-location').value = matchData.location;
      modal3.style.display = 'block';
    }

    

  </script>


</body>
</html>