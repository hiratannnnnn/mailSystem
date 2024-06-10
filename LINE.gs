//固定値
var channel_token = "CHANNELTOKEN"
var url = "https://api.line.me/v2/bot/message/reply"
// 架空のイベントデータを生成する関数
function generateMockEvent() {
  return {
    postData: {
      contents: JSON.stringify({
        events: [
          {
            type: "message",
            replyToken: "00000000000000000000000000000000",
            source: {
              userId: "U1234567890abcdef1234567890abcdef",
              type: "user"
            },
            timestamp: 1462629479859,
            message: {
              type: "text",
              id: "325708",
              text: "振込" // この部分を変更して異なるテキストメッセージをテスト
            }
          }
        ]
      })
    }
  };
}

// デバッグ用にdoPost関数を呼び出す
function testDoPost() {
  var mockEvent = generateMockEvent();
  doPost(mockEvent); // モックデータをdoPost関数に渡す
}

//LINEからのイベントがdoPostにとんでくる
function doPost(e) {
  var json = e.postData.contents;
  var events = JSON.parse(json).events;

  events.forEach(function(event) {
    if (event.type == "message" && event.message.type == "text") {
      var userMessage = event.message.text; // ユーザーからのメッセージを取得
      Logger.log(userMessage);

      if (userMessage.includes("フルネーム　") || userMessage.includes("フルネーム ")) {
        // ユーザーのフルネームを抽出
        userMessage = userMessage.replace("「","").replace("『","").replace("」","").replace("』","");
        var fullName = userMessage.substring("フルネーム　".length);

        // 氏名登録の処理
        registerFullName(event.source.userId, fullName);

        // 登録確認メッセージをユーザーに送信
        fullName = fullName.replace("　"," ");
        var text = 
            fullName + " さんとして登録しました！\n" +
            "もし間違えてしまった場合には、同じようにもう一度送信し直してください。\n\n" +
            "〇〇大会の案内→「〇〇　案内」（正式名称の一部であればOK）\n" +  
            fullName.split(" ")[0] + "さまのまだ振込が済んでいない大会を表示→「振込」\n" + 
            "申込受付中の大会を表示→「申込」\n" + 
            "出場した公認大会の回数→「回数」\n" + 
            "速報用シートのリンク→「速報」\n" + 
            "データベースのリンク→「データ」\n\n" + 
            "その他の問合せは、お手数ですが大会係または keiokarutakai24@gmail.com までご連絡ください。";
        sendReplyMessage(event.replyToken,text);
      } else if (userMessage.includes("振込") || userMessage.includes("振り込み")) {
        var userId = event.source.userId;
        var fullName = findFullName(userId);
        if(fullName === "あ") {
          var text = 
              "まずはフルネームの登録をしてください。\n\n『フルネーム　〇〇　〇〇』\n\nという1行を送信してください。";
          sendReplyMessage(event.replyToken,text);
          return;
        }
        var yetFurikomi = lookupFurikomi(fullName);

        var text = 
          fullName + "さま\n" + 
          yetFurikomi + 
          "\n振込が反映されるまで時間がかかる可能性がありますので、「先ほど振り込んだのに」という方は少々お待ちください。また、当日支払いなど、参加費の支払いの方法が大会によって違う場合や、システム上のミスの可能性もありますので、まずは必ず元のメールを参照してください。その上で疑問点がある場合は大会係、または keiokarutakai24@gmail.com まで直接お問い合わせください。";
        sendReplyMessage(event.replyToken,text);
      } else if (userMessage.includes("申込") || userMessage.includes("申し込み")) {
        var moshikomi = lookupMoshikomi();
        var text = moshikomi + "\n以上が受付中の大会です。詳しい情報はメールをご参照ください。";
        sendReplyMessage(event.replyToken,text);
      } else if (userMessage.includes("速報")) {
        var text =
            "速報用シートのリンクは↓\n" + "https://docs.google.com/spreadsheets/d/1PfjDfFqEiDFXx0DClQ_IY4oaZEDFG70H7OD8qsT2aSc/edit#gid=1551484855";
        sendReplyMessage(event.replyToken,text);
      } else if (userMessage.includes("データ")) {
        var text = 
            "データベースのリンクは↓\n" + "http://keiokarutakai.atwebpages.com/database.php\nです。\n" + "合言葉は「ゆずりん」です。\n"+
            "点々から「ブラウザから開く」を押すとスマホ用の画面になると思います。";
            //"使い方説明の動画 ↓\n" + 
            //"https://drive.google.com/file/d/1RF2s-z0NCSSYyNsNBMMg4zRtx77wL1w5/view?usp=drive_link"

        sendReplyMessage(event.replyToken,text);
      } else if (userMessage.includes("案内")) {
        var text = fetchAnnounce(userMessage);
        sendReplyMessage(event.replyToken,text);
        
      } else if (userMessage === "んぬ！") {
        var text = "んぬ！";
        sendReplyMessage(event.replyToken,text);
      } else if (userMessage.includes("回数")) {
        var fullName = findFullName(event.source.userId);
        if(fullName === "あ") {
          var text = 
              "まずはフルネームの登録をしてください。\n\n『フルネーム　〇〇　〇〇』\n\nという1行を送信してください。";
          sendReplyMessage(event.replyToken,text);
          return;
        }
        var today = new Date();
        var year = today.getFullYear();
        var matchesList = fetchCountMatches(fullName,today);
        var text = 
        `${fullName}さま
${year-1}年度内で公認大会に出場したのは ${matchesList.length} 回です。`;
        matchesList.forEach(function(item) {
          text += '\n' + item.date + "," + item.location;
        });
        text += "申し込む際に記載するのは、「申込開始日」までの回数であることに注意してください。";
        sendReplyMessage(event.replyToken,text);
      } else {
        // ここで通常の自動返信メッセージを定義して使用
        var text = 
            "すみません。認識ができませんでした。\n" + 
            "名前の登録をする場合には「フルネーム　」という文字もつけてください。\n\n" + 
            "〇〇大会の案内→「〇〇　案内」（正式名称の一部であればOK）\n" + 
            "まだ振込が済んでいない大会を表示→「振込」\n" + 
            "申込受付中の大会を表示→「申込」\n" + 
            "出場した公認大会の回数→「回数」\n" + 
            "速報用シートのリンク→「速報」\n" + 
            "データベースのリンク→「データ」\n\n" + 
            "と入力してください！その他の問合せは、お手数ですが大会係または keiokarutakai24@gmail.com までご連絡ください。";
        sendReplyMessage(event.replyToken, text);
      }
    }
  });
}

function sendReplyMessage(replyToken, messages) {
  UrlFetchApp.fetch(url, {
      "method": "post",
      "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + channel_token
      },
      "payload": JSON.stringify({
          "replyToken": replyToken,
          "messages": [{"type": "text", "text": messages}]
      })
  });
}


function registerFullName(userId, fullName) {
  var ss = SpreadsheetApp.openById("**********************");
  var userListSheet = ss.getSheetByName("LINE");
  var dataRange = userListSheet.getDataRange();
  var values = dataRange.getValues();
  fullName = fullName.replace("　", " ");
  
  var userIdExists = false; // userIdが存在するかのフラグ
  
  // 1行目はカラム名が入っているので、2行目からループを開始
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == userId) { // 1列目（userId）が一致するかチェック
      userIdExists = true;
      userListSheet.getRange(i + 1, 2).setValue(fullName); // 2列目（フルネーム）を更新
      break; // 一致したらループを抜ける
    }
  }
  
  // userIdが存在しなかった場合、新しく追加
  if (!userIdExists) {
    userListSheet.appendRow([userId, fullName]);
  }
}

function findFullName(userId) {
  var ss = SpreadsheetApp.openById("*************************");
  var userListSheet = ss.getSheetByName("LINE");
  var data = userListSheet.getDataRange().getValues();
  for (i=1;i<data.length;i++) {
    if(data[i][0] === userId){
      return data[i][1];
    }
  }
  return "あ";
}

function findUserId(fullName) {
  var ss = SpreadsheetApp.openById("***********************");
  var userListSheet = ss.getSheetByName("LINE");
  var data = userListSheet.getDataRange().getValues();
  for (i=1;i<data.length;i++) {
    if(data[i][1] === fullName) {
      return data[i][0];
    }
  }
  return "い";
}

function recordMessage(userId,message) {
  var ss = SpreadsheetApp.openById("****************************");
  var userListSheet = ss.getSheetByName("LINE");
  var data = userListSheet.getDataRange().getValues();
  for (i=1;i<data.length;i++) {
    if(data[i][0] === userId) {
      userListSheet.getRange(i+1,3).setValue(message);
    }
  }
}

function lookupFurikomi(fullName) {
  var ss = SpreadsheetApp.openById("************************");
  var calendarSheet = ss.getSheetByName("カレンダー");
  var calendarData = calendarSheet.getDataRange().getValues();
  var matchList = [];
  for(i=2;i<calendarData.length;i++) {
    if(calendarData[i][12] === "完了" || calendarData[i][7] === "")continue;
    matchList.push(calendarData[i][0]);
  }
  var result = "";
  Logger.log(matchList);
  for(i=0;i<matchList.length;i++) {
    var sheet = ss.getSheetByName(matchList[i]);
    var count = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].filter(function(cell) {
      return typeof(cell) === "number";
    })[0];
    var data = sheet.getDataRange().getValues();
    for(k=1;k<data.length;k++) {
      if(data[k][count+4] === "↓送信予定日時（yyyy-MM-dd HH:mm:ss）"){
        var date = data[k+1][count+4];
      }
    }
    if(!date)date = false;
    Logger.log(date);
    for(j=1;j<data.length;j++) {
      if(data[j][2] === fullName || data[j][2] === fullName.replace(" ","　")) {
        if(data[j][count+2] !== "" && data[j][count+2] !== "催促メールを送信しました。"){
          result += matchList[i] + "：振込を確認できている、もしくは現状は振込は不要です。\n\n";
        } else {
          result += matchList[i] + "：振込を確認できていません。"
          if(date !== false)result += "期日は" + Utilities.formatDate(date,"JST","yyyy年MM月dd日") + "です。";
          result += "\n\n";
        }
      }
    }
  }
  if(matchList.length === 0 || result === "") {
    result = "振込が必要な大会はまだありません。"
  }
  Logger.log(result);
  return result;
}

function lookupMoshikomi() {
  var ss = SpreadsheetApp.openById("**************************");
  var calendarSheet = ss.getSheetByName("カレンダー");
  var calendarData = calendarSheet.getDataRange().getValues();
  var matchList = [];
  var now = new Date();
  for (i=2;i<calendarData.length;i++) {
    if(calendarData[i][3] === "")continue;
    var reminderDate = new Date(calendarData[i][3].getTime() + 48*60*60*1000);
    if(now < reminderDate){
      matchList.push(calendarData[i][0]);
    }
  }
  var emailSheet = ss.getSheetByName("メール管理");
  var emailData = emailSheet.getDataRange().getValues();
  var result = "";
  for(i=5;i<emailData.length;i++){
    if(matchList.includes(emailData[i][0] + emailData[i][1]) && emailData[i][3] === "リマインダー"){
      result += emailData[i][0] + emailData[i][1] + "：\n" + emailData[i][5] + "\n\n";
    }
  }
  return result;
}

function sendLineMessage(fullName,tournamentName) {
  var userId = findUserId(fullName.replace("　"," "));
  if(userId === "い")return;
  var message = 
`【振込期限】
${tournamentName}の振込期限は今日です。

keiokarutakai24@gmail.com から別途メールが行っていると思いますので、詳細はそちらをご覧ください。

このラインアカウントは送信専用なので、詳しいラインを送られても返信することができません。

なにかご相談などがある場合には大会係、副会長、または keiokarutakai24@gmail.com までご連絡ください。

よろしくお願いします。`
  sendPushMessage(userId, message);
}

function sendPushMessage(userId, messageText) {
  var url = 'https://api.line.me/v2/bot/message/push';
  var payload = JSON.stringify({
    to: userId,
    messages: [
      {
        type: 'text',
        text: messageText
      }
    ]
  });

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + channel_token,
    },
    'payload': payload
  };

  UrlFetchApp.fetch(url, options);

  recordMessage(userId,messageText);
}

function fetchAnnounce(userMessage) {
  var ss = SpreadsheetApp.openById("*******************************");
  var calendarSheet = ss.getSheetByName("カレンダー");
  var data = calendarSheet.getDataRange().getValues();
  for (i=data.length-1;i>1;i--) {
    var tournamentName = data[i][0];
    var text = userMessage.replace("案内","").trim();
    Logger.log(text);
    if(tournamentName.includes(text)) {
      var a = data[i][15].replace(/<br>/g,"\n");
      if(a === "") {
        return "まだ送信されていない案内です。今しばらくお待ちください。";
      }
      return a;
    }
  }
  return "見つかりませんでした。\nもう一度言葉を変えて試してみてください。";
}
