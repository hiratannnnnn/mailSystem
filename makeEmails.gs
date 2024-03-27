function sendEmails() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var emailSheet = ss.getSheetByName("メール管理");
  var emailData = emailSheet.getRange("A6:I" + emailSheet.getLastRow()).getValues();
  var now = new Date();

  for (var i = 0; i < emailData.length; i++) {
    if(emailData[i][7] != "")continue;//送信したいタイミングのとき以外は何かしらの文字列を。
    if(emailData[i][6] != "済")continue;//済じゃないのに実行されないように
    var row = emailData[i];
    var targetDate = row[2];
    Logger.log(now.getTime() - targetDate.getTime());
    if ((now.getTime() - targetDate.getTime()) >= 120000) {
      emailSheet.getRange("H" + (i + 6)).setValue("無効");
      continue;
    } else if(now.getTime() < targetDate.getTime()) {
      emailSheet.getRange("H" + (i+6)).setValue("");
      continue;
    }
    if(row[3] == "リマインダー"){
      sendReminders(emailSheet,row,now,i+6);
    }else if (row[3] == "振込確認"){
      sendPaymentReminders(ss,emailSheet,now,i+6);
    }else if (row[3] == "テストなど"){
      sendTestMails(emailSheet,row,now,i+6);
    }
  }
}

function sendReminders(emailSheet,row,now,rowNum) {
  Logger.log("sendReminders" + row);
  var tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  var weekdays = ["日", "月", "火", "水", "木", "金", "土"];  
  var tournamentName = row[0];
  var grades = row[1];
  var targetDate = row[2];
  var tomorrowDateStr = Utilities.formatDate(tomorrow, "JST", "M月d日") + "（" + weekdays[tomorrow.getDay()] + "）";

  var subject = tournamentName+grades + "　リマインダー";
  var threadTitle = row[4];
  if(threadTitle == ""){
    var quotedEmailContent = "";
  } else {
    var quotedEmailContent = quoteEmail(threadTitle);
  }
  var formLink = row[5];
  
  var to = emailSheet.getRange("I"+1).getValue();
  var bcc = emailSheet.getRange("I"+2).getValue();
  var includeNotPaid = row[8];
  var participantList = makeParticipantList(tournamentName,grades,includeNotPaid);//構成する

  var emailBody = createEmailBody(tournamentName,grades,participantList,tomorrowDateStr,formLink,quotedEmailContent);
  var htmlBody = convertToHtml(emailBody);

  // 過ぎているかどうか
  if (now.getTime() >= targetDate.getTime() && now.getTime() - targetDate.getTime() <= 120000) {//2分までの誤差を許容する
    // メールを送信
    MailApp.sendEmail({
      to: to,
      bcc: bcc,
      name: "慶應かるた会",
      subject: subject,
      body: emailBody,
      htmlBody: htmlBody
    });
    Logger.log("送信を完了しました");
    // 送信完了を記録
    emailSheet.getRange("H" + rowNum).setValue("済");
  } else {
    emailSheet.getRange("H" + rowNum).setValue("送信されませんでした。");
  }
}

function sendPaymentReminders(ss,emailSheet,now,rowNum) {
  var row = emailSheet.getRange(rowNum,1,1,9).getValues()[0];
  var tournamentName = row[0];
  Logger.log("sendPaymentReminders" + tournamentName);
  var grades = row[1];
  var targetDate = row[2];

  if (now.getTime() >= targetDate.getTime() && now.getTime() - targetDate.getTime() <= 120000) {
    var tournamentSheet = ss.getSheetByName(tournamentName+grades);
    var count = tournamentSheet.getRange(1,1,1,tournamentSheet.getLastColumn()).getValues()[0].filter(function(cell) {
      return typeof(cell) === "number";
    })[0];
    Logger.log(count);
    var data = tournamentSheet.getRange('B:'+String.fromCharCode(67+count)).getValues();
    data = removeEmptyRows(data);
    data.shift();
    Logger.log(data);

    var ifAfter = row[8];
    for (var j = 0; j < data.length; j++) {
      var email = data[j][0];
      var name = data[j][1];
      var paymentStatus = data[j][count+1];
      Logger.log(paymentStatus);
      if (paymentStatus === '') {
        // メールの内容を作成（仮）
        var emailBody = createEmailBody2(name,tournamentName,grades,ifAfter);
        var subject = '【振込期限について】' + tournamentName;
        var htmlBody = convertToHtml(emailBody);
        // メール送信
        ///*
        MailApp.sendEmail({
          to: email, 
          subject: subject, 
          name: "慶應かるた会",
          body: emailBody,
          htmlBody: htmlBody
        });
        sendLineMessage(name,tournamentName);
        //*/
        Logger.log(name+"さんに送信しました。");
        tournamentSheet.getRange(j+2,count+3).setValue("催促メールを送信しました。");
      }
    }
    emailSheet.getRange(rowNum,8).setValue("済");
  } else {
    Logger.log(now.getTime());
    Logger.log(targetDate.getTime());
    emailSheet.getRange(rowNum,8).setValue("送信されませんでした。");
  }
}

function setReminders(state=false,input="") {
  Logger.log("setReminders " + "state:" + state + "input:" + input);
  // アクティブなスプレッドシートを取得
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('メール管理');
  var admin = sheet.getRange("J2").getValue();
  var adminRange = sheet.getRange('K4');
  var calendarSheet = ss.getSheetByName("カレンダー");
  var ui = SpreadsheetApp.getUi(); 
  // 必要な行のデータを一度に取得
  var rowNum = sheet.getRange('C2').getValue();
  var rowValues = sheet.getRange(rowNum, 1, 1, 8).getValues()[0]; // 1行8列分のデータを取得

  var tournamentName = rowValues[0];
  var grades = rowValues[1];
  var targetDateStr = rowValues[2];
  var formLink = rowValues[5];
  var threadTitle = rowValues[4];
  Logger.log(threadTitle);
  var status = rowValues[7];

  // 送信済みかどうかのチェック
  if (status == "済" && admin !== true) {
    if(state===false){
      ui.alert('エラー', '送信済みとなっています。行番号に間違いがないかどうか見直してください。', ui.ButtonSet.OK);
    } else {
      adminRange.setValue("送信済みとなっています。");
    }
    return;
  }
  
  if (targetDateStr === "" && admin !== true) {
    if(state===false){
      ui.alert('エラー', '送信予定日時を設定しないとリマインダー設定できません。', ui.ButtonSet.OK);
    } else {
      adminRange.setValue("送信予定日時を設定してください。");
    }
    return;
  }

  var targetDate = new Date(targetDateStr);
  var now = new Date();

  if (targetDate.getTime() <= now.getTime() && admin !== true) {
    if(state===false){
      ui.alert('エラー', '送信予定日時は現在時刻よりも未来である必要があります。', ui.ButtonSet.OK);
    } else {
      adminRange.setValue("送信予定日時は現在時刻よりも未来である必要があります。");
    }
    return;
  }

  // 未振り込み者を表示するかどうかの確認
  if(state===false){
    var includeNotPaid = ui.alert(
      '振込について',
      '未振り込み者を表示しますか？\n大体の大会は抽選後の前納制、もしくは後納制ですので、「いいえ」を選択してください。ただし、申込時点で振込まで完了する必要がある場合は「OK」を選択してください。\n「いいえ」→表示しない、「OK」→表示する',
      ui.ButtonSet.YES_NO
    ) === ui.Button.YES;
  } else {
    var includeNotPaid = input === "" ? false : true;
  }

  // makeParticipantList と tomorrowDate の計算
  var participantList = makeParticipantList(tournamentName, grades, includeNotPaid);
  var weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  var tomorrow = new Date(targetDateStr);
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowDateStr = Utilities.formatDate(tomorrow, "JST", "M月d日") + "（" + weekdays[tomorrow.getDay()] + "）";
  if(state===false){
    if (threadTitle == "") {
      if (ui.alert(
        '件名',
        '引用する案内メールの件名が空欄になっています。\n戻る場合は「いいえ」を、引用せずにこのまま続行する場合は「OK」を押してください。',
        ui.ButtonSet.YES_NO
      ) == ui.Button.YES) {
        var quotedEmailContent = "";
      } else {
        return;
      }
    } else {
      var quotedEmailContent = quoteEmail(threadTitle);
      Logger.log(quotedEmailContent);
      if (quotedEmailContent === "") {
        ui.alert(
          'エラー',
          threadTitle + '\nこの件名ではメールを見つけることができませんでした。もう一度間違いがないか確認してください。案内メールの引用なしで続ける場合は、件名の欄を空欄にして実行してください。',
          ui.ButtonSet.OK
        )
        return;
      }
    }
  } else { // 合っている前提で行く
    var quotedEmailContent = quoteEmail(threadTitle);
  }
  
  var emailBody = createEmailBody(tournamentName, grades, participantList, tomorrowDateStr, formLink, quotedEmailContent);
  // ユーザにメールの全文と送信日時を確認してもらう
  if(state===false){
    var response = ui.alert(
      'メールプレビュー',
      'この内容で' + Utilities.formatDate(targetDate, "JST", "yyyy'年'MM'月'dd'日の'HH'時'mm'分'") + 'にリマインダーを設定しますがよろしいですか？「いいえ」を押すとキャンセルされ、「OK」を押すと設定されます。（申込者と未振り込み者は送信直前に確定されます。）\n\n' + "    「\n" + emailBody + "\n」",
      ui.ButtonSet.YES_NO
    );
  } else {
    var response = ui.Button.YES;
  }

  // ユーザが「OK」を選択した場合、リマインダーを設定
  if (response == ui.Button.YES) {
    ScriptApp.newTrigger('sendEmails')
      .timeBased()
      .at(targetDate)
      .create();
    sheet.getRange(rowNum,7,1,3).setValues([["済","",includeNotPaid]]);

    var tournamentSheet = ss.getSheetByName(tournamentName+grades);
    var count = tournamentSheet.getRange(1,1,1,tournamentSheet.getLastColumn()).getValues()[0].filter(function(cell) {
      return typeof(cell) === "number";
    })[0];
    var formId = tournamentSheet.getRange(1,count + 4).getValue();

    var form = FormApp.openById(formId);
    var description = 
    "こちらは" + tournamentName + grades + "の参加表明フォームです。\n" +
    "該当項目に回答の上、送信してください。\n" +
    "このフォームの回答期限は【" + tomorrowDateStr + "】の23:59までです。\n" + 
    "回答が正しく送信されている場合、入力いただいたメールアドレスに回答のコピーが届きますのでご確認ください。"
    ;
    form.setDescription(description);
    var calendarRowNum = findFromCalendar(calendarSheet,tournamentName+grades);
    Logger.log(calendarRowNum);
    calendarSheet.getRange(calendarRowNum,4).setValue(Utilities.formatDate(targetDate,"JST","yyyy/MM/dd"));
    var moshikomiStart = new Date(targetDate.getTime() + 48 * 60 * 60 * 1000);
    calendarSheet.getRange(calendarRowNum,5).setValue(Utilities.formatDate(moshikomiStart,"JST","yyyy/MM/dd"));
  } else {
    // ユーザが「いいえ」を選択した場合、処理を中断
    return;
  }
}

function setPaymentReminders(name="",state=false) {
  Logger.log("setPaymentReminder " + "name:" + name + "state:" + state);
  // 現在のシートを取得
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if(name === "") {
    var currentSheet = ss.getActiveSheet();
  } else {
    var currentSheet = ss.getSheetByName(name);
  }
  var calendarSheet = ss.getSheetByName("カレンダー");
  var sheetName = currentSheet.getName();
  const match = sheetName.match(/(.*?)([A-Z]+級)$/);
  if (sheetName == "フォーム作成" || sheetName == "メール管理") {
    ui.alert(
      '注意',
      'この関数は「フォーム作成」または「メール管理」に適用することはできません。該当する大会のシートを開いた状態で実行してください。',
      ui.ButtonSet.OK
    )
    return;
  }
  
  var count = currentSheet.getRange(1,1,1,currentSheet.getLastColumn()).getValues()[0].filter(function(cell) {
      return typeof(cell) === "number";
    })[0];
  var columnData = currentSheet.getRange(2, count + 4, currentSheet.getLastRow(),1).getValues();
  var where;
  for (var i = 0; i < columnData.length; i++) {
    if (columnData[i][0] === "催促メール設定（「☆大会フォーム」から）") {
      // 見つかった場合、その一つ下のセルに「設定済み」を書き込む
      where = i;
      break;
    }
  }
  var sendDateTime = currentSheet.getRange(where + 3,count + 5).getValue();
  if(typeof(sendDateTime) === "string" || sendDateTime === ""){
    if(state === false){
      ui.alert(
        '注意',
        '送信時刻が入力されていない場合は設定することができません。',
        ui.ButtonSet.OK
      );
    }
    return;
  }
  var ifAfter = currentSheet.getRange(where+4,count+5).getValue() === "" ? false : true;
  Logger.log(ifAfter);  
  var ifAfterStr = ifAfter ? '後' : '前';
  if(state === false) {if(ui.alert(
      '確認',
      sheetName + 'について、「振り込み済みか」列の欄が空欄になっている人に対して、振込期限のリマインダーメールを' + 
      Utilities.formatDate(sendDateTime, "JST", "yyyy年MM月dd日　HH時mm分")
      + 'に送信します。\n' + 
      'この大会は' + ifAfterStr + '納制です。\n' + 
      '氏名の間に空白（「　」または「 」）が入っていない場合は送信時刻までに空白を入れてください。\nよろしい場合は「OK」を押してください。「いいえ」を押すと設定されずに戻ります。',
      ui.ButtonSet.YES_NO
    ) == ui.Button.NO)return;
  }
  // "メール管理"シートを取得
  var emailSheet = ss.getSheetByName('メール管理');
  var emailSheetLastRow = emailSheet.getLastRow();
  var emailData = emailSheet.getRange('A6:H' + emailSheetLastRow).getValues();
  var paymentRow;

  // 送信日時を探す
  var isInSheet = sendDateTime === "";
  Logger.log(isInSheet);
  if (isInSheet) {
    for (var i = 0; i < emailData.length; i++) {
      if (emailData[i][0] + emailData[i][1] === sheetName) {
        paymentRow = emailData[i];
        paymentRow[3] = "振込確認"
        sendDateTime = new Date(emailData[i][2]);
        var nextDay = new Date(sendDateTime.getTime() + (24 * 60 * 60 * 1000));
        nextDay.setHours(8);
        nextDay.setMinutes(0);
        nextDay.setSeconds(0);
        sendDateTime = nextDay;
        var nextDayStr = Utilities.formatDate(nextDay,"JST","yyyy-MM-dd HH:mm:ss");
        paymentRow[2] = nextDayStr;
        break;
      }
    }
  } else {
    paymentRow = [match[1],match[2],sendDateTime,"振込確認","","","","",ifAfter];
    paymentRow[2] = Utilities.formatDate(sendDateTime,"JST","yyyy-MM-dd HH:mm:ss");
  }
  Logger.log(paymentRow);
  
  //トリガーを設定
  ScriptApp.newTrigger('sendEmails')
      .timeBased()
      .at(sendDateTime)
      .create();
  paymentRow[6] = "済";
  emailSheet.getRange(emailSheetLastRow+1,1,1,9).setValues([paymentRow]);
  currentSheet.getRange(where + 3, count + 4).setValue("設定済み");
  var calendarRowNum = findFromCalendar(calendarSheet,sheetName);
  calendarSheet.getRange(calendarRowNum,9).setValue(Utilities.formatDate(sendDateTime,"JST","yyyy/MM/dd"));
  var now = new Date();
  var now2 = new Date(now.getTime() + 24*60*60*1000);
  calendarSheet.getRange(calendarRowNum,10).setValue(Utilities.formatDate(now2,"JST","yyyy/MM/dd"));
}

function makeParticipantList(title, grades, includeNotPaid) {
  Logger.log("makeParticipantList");
  // スプレッドシートを開く
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // title+grades の名前でシートを検索して開く
  var sheet = ss.getSheetByName(title + grades);
  var count = sheet.getRange(1,sheet.getLastColumn()).getValue();

  
  // C, D, G 列のデータを取得
  var data = sheet.getRange(2,3,sheet.getLastRow()-1,count+1).getValues();
  data = data.filter(function(row) {
    return row[2] !== "";
  });
  Logger.log(data);
  
  var participantListByGrade = {};
  var gradesArray = grades.split("");
  gradesArray.pop();
  for (var i = 0; i < gradesArray.length; i++) {
    var grade = gradesArray[i] + "級";
    participantListByGrade[grade] = [];
  }

  var participantsByLastName = {};
  data.forEach(function(row) {
    var fullName = row[0].replace("　", " ");
    var lastName = fullName.split(" ")[0];

    if (!participantsByLastName[lastName]) {
      participantsByLastName[lastName] = [];
    }

    participantsByLastName[lastName].push(fullName);
  });
  Logger.log(participantsByLastName);
  
  var paidList = []; // 振り込み者のリスト

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var name = row[0]; // C列: 氏名
    var gradeStr = row[2]; // D列: 級（"A"のような形）
    //Logger.log("gradeStr: " + gradeStr);
    var paidStatus = row[row.length - 1]; 
    
    var isPaid = paidStatus.trim() !== "";
    name = name.replace("　"," ");

    Logger.log(name);
    //var lastName = name.split(/\s|　/)[0];
    Logger.log(isPaid);
    
    if (isPaid && !paidList.includes(name) && isPaid !== "催促メールを送信しました。") {
      Logger.log("あ");
      paidList.push(name);
    }
    
    // 級ごとに名前を振り分け
    var individualGrades = gradeStr.replace("級", "").split("");

    for (var j = 0; j < individualGrades.length; j++) {
      var grade = individualGrades[j] + "級";
      if (participantListByGrade[grade] && !participantListByGrade[grade].includes(name)) {
        participantListByGrade[grade].push(name);
      }
    }
  }
  participantListByGrade = updateParticipantNames(participantListByGrade,participantsByLastName);
  paidList = updatePaidListNames(paidList,participantsByLastName);
  Logger.log(participantListByGrade);
  var resultStr = "";
  var totalApplicants = 0;
  
  for (var grade in participantListByGrade) {
    totalApplicants += participantListByGrade[grade].length;
  }
  
  if (totalApplicants === 0) {
    resultStr = "現在、どなたからも申し込みは頂いておりません。\n";
  } else {
    resultStr += "現在、以下の方々からご連絡を頂いております。(敬称略)\n";
    for (var grade in participantListByGrade) {
      resultStr += grade + "：";
      if (participantListByGrade[grade].length > 0) {
        resultStr += participantListByGrade[grade].join("、") + "\n";
      } else {
        resultStr += "\n";
      }
    }
    if (includeNotPaid && paidList.length > 0) {
      Logger.log(paidList);
      resultStr += "\nそのうち、振込の完了を確認できている方：\n" + paidList.join("、") + "\n\n確認漏れがございましたら申し訳ありません。\n明日までに振込を確認できない場合はキャンセルとせざるを得ませんので、ご了承ください。\nご相談等がある場合は、このメールに返信するか、副会長までご連絡ください。\n";
    }
  }
  
  return resultStr;
}

function createDraft(state=false,input1="",input2="") {
  Logger.log("createDraft " + "state:" + state + "input1:" + input1 + "input2" + input2);
  var ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const createEmailSheet = ss.getSheetByName("案内メール作成");
  var data = createEmailSheet.getRange(1,1,createEmailSheet.getLastRow(),createEmailSheet.getLastColumn()).getValues();
  var to = data[0][10];
  var bcc = data[1][10];
  var subject = data[2][1] + data[3][1] + "　案内";
  var emailBody = data[1][3];
  var whenPay = data[24][1];
  var reminderDate = data[25][1];

  if(state===false){
    if(ui.alert(
      '確認',
      '宛先: '+ to + "\n" +
      "bcc: " + bcc + "\n" +
      "件名: " + subject + "\n" +
      "本文: \n" + emailBody + "\n" +
      "という内容の下書きを作成します。（送信はされません。）\n" + 
      "よろしい場合は「OK」を押してください。「いいえ」を押すと何もせずに戻ります。",
      ui.ButtonSet.YES_NO
    ) === ui.Button.NO)return;
  }

  GmailApp.createDraft(to,subject,emailBody,{bcc: bcc,name:"慶應かるた会"});

  var emailSheet = ss.getSheetByName("メール管理");
  var emailData = emailSheet.getDataRange().getValues();
  for (var i=0;i<emailData.length;i++) {
    if(emailData[i][0] === data[2][1]) {
      var date = new Date(reminderDate.getTime() - 24 * 60 * 60 * 1000);
      date.setHours(8);
      date.setMinutes(0);
      date.getSeconds(0);
      date = Utilities.formatDate(date,"JST","yyyy-MM-dd HH:mm:ss");
      emailSheet.getRange(i + 1,3).setValue(date);
    }
  }
  if(state===false) {
    if(ui.alert(
      'リマインダー',
      'このままリマインダーの設定に移りますか？',
      ui.ButtonSet.YES_NO
    ) === ui.Button.YES) {
      setReminders();
    };
  } else {
    if(input1 !== "") {
      setReminders(state=true,input=input2);
    }
  }
  var calendarSheet = ss.getSheetByName("カレンダー");
  var calendarData = calendarSheet.getDataRange().getValues();
  for (var i=0;i<calendarData.length;i++) {
    if(calendarData[i][0] === data[2][1] + data[3][1]) {
      if(data[5][1] === "") {
        calendarData[i][14] = Utilities.formatDate(data[4][1],"JST","yyyy/MM/dd");
      } else {
        calendarData[i][14] = Utilities.formatDate(data[4][1],"JST","yyyy/MM/dd") + "など";
      }
    } 
  }
  calendarSheet.getDataRange().setValues(calendarData);
}

function createDraft2(state=false,input="") {
  Logger.log("createDraft2 " + "state:" + state + "input:" + input);
  var ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const createEmailSheet = ss.getSheetByName("案内メール作成");
  var data = createEmailSheet.getRange(1,1,createEmailSheet.getLastRow(),createEmailSheet.getLastColumn()).getValues();
  var to = data[0][10];
  var bcc = data[1][10];
  var subject = data[31][1] + "　出場者確定のお知らせ";
  var emailBody = data[31][3];
  if(state===false) {
    if(ui.alert(
      '確認',
      '宛先: '+ to + "\n" +
      "bcc: " + bcc + "\n" +
      "件名: " + subject + "\n" +
      "本文: \n" + emailBody + "\n" +
      "という内容の下書きを作成します。（送信はされません。）\n" + 
      "よろしい場合は「OK」を押してください。「いいえ」を押すと何もせずに戻ります。",
      ui.ButtonSet.YES_NO
    ) === ui.Button.NO)return;
  }

  GmailApp.createDraft(to,subject,emailBody,{bcc: bcc,name:"慶應かるた会"});

  var tournamentName = data[31][1];
  var date = data[39][1];
  var tournamentSheet = ss.getSheetByName(tournamentName);
  var count = tournamentSheet.getRange(1,1,1,tournamentSheet.getLastColumn()).getValues()[0].filter(function(cell) {
      return typeof(cell) === "number";
    })[0];
  var columnData = tournamentSheet.getRange(2, count + 4, tournamentSheet.getLastRow(),1).getValues();
  var where=0;
  for (var i = 0; i < columnData.length; i++) {
    if (columnData[i][0] === "催促メール設定（「☆大会フォーム」から）") {
      // 見つかった場合、その一つ下のセルに「設定済み」を書き込む
      where = i;
      break;
    }
  }
  date.setHours(7);
  date.setMinutes(50);
  if(state===false) {
    if(ui.alert(
      '確認',
      '下書きを作成しました。\nまた、催促メールの設定を' + Utilities.formatDate(date,"JST","yyyy-MM-dd HH:mm:ss") + 'に設定しますがよろしいですか？\nよろしい場合は「OK」を押してください。「いいえ」を押すと催促メールは設定されません。',
      ui.ButtonSet.YES_NO
    ) === ui.Button.NO)return;
  } else {
    if(input === "") {
      return;
    }
  }
  Logger.log("日時設定");
  tournamentSheet.getRange(where + 3,count + 5).setValue(date);
  setPaymentReminders(name=tournamentName,state=true);
}
function createDraft3() {
  Logger.log("createDraft3");
  var ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const createEmailSheet = ss.getSheetByName("案内メール作成");
  var data = createEmailSheet.getDataRange().getValues();
  var to = data[0][10];
  var bcc = data[1][10];
  var subject = data[54][1];
  var emailBody = data[54][3];

  if(ui.alert(
    '確認',
    '宛先: '+ to + "\n" +
    "bcc: " + bcc + "\n" +
    "件名: " + subject + "\n" +
    "本文: \n" + emailBody + "\n" +
    "という内容の下書きを作成します。（送信はされません。）\n" + 
    "よろしい場合は「OK」を押してください。「いいえ」を押すと何もせずに戻ります。",
    ui.ButtonSet.YES_NO
  ) === ui.Button.NO)return;

  GmailApp.createDraft(to,subject,emailBody,{bcc: bcc,name:"慶應かるた会"});
}

function createDraft4() {
  Logger.log("createDraft4");
  var ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const createEmailSheet = ss.getSheetByName("案内メール作成");
  var data = createEmailSheet.getDataRange().getValues();
  var to = data[0][10];
  var bcc = data[1][10];
  var subject = data[74][1];
  var sub = data[75][1];
  subject = subject.split("　")[0] + "（" +  sub + "）　" + subject.split("　")[1];
  var emailBody = data[74][3];

  if(ui.alert(
    '確認',
    '宛先: '+ to + "\n" +
    "bcc: " + bcc + "\n" +
    "件名: " + subject + "\n" +
    "本文: \n" + emailBody + "\n" +
    "という内容の下書きを作成します。（送信はされません。）\n" + 
    "よろしい場合は「OK」を押してください。「いいえ」を押すと何もせずに戻ります。",
    ui.ButtonSet.YES_NO
  ) === ui.Button.NO)return;

  GmailApp.createDraft(to,subject,emailBody,{bcc: bcc,name:"慶應かるた会"});
}

function createEmailBody2(name,title,grades,ifAfter) {
  var emailSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("メール管理");
  var data = emailSheet.getRange("A6:I" + emailSheet.getLastRow()).getValues();
  var date = Utilities.formatDate(new Date(),"JST","MM月dd日");
  for (var i=0;i<data.length;i++){
    if(data[i][0] + data[i][1] === title + grades && data[i][3] === "リマインダー"){
      if(data[i][8] === true){
        var date = Utilities.formatDate(new Date(data[i][2].getTime() + 24*60*60*1000),"JST","MM月dd日");
        break;
      }
    }
  }
  var splitName = name.split(/\s|　/);
  name = splitName.join(" ");
  if(!ifAfter){
    var body = 
`${name} 様


おはようございます。

このメールは、慶應かるた会のメールシステムが自動で送信しています。

現在、【${title}】につきまして、${splitName[0]}様からの振り込みを確認できておりません。（タイムラグがあるため、もし入れ違いになってしまっておりましたら申し訳ありません。）

【${date}】の夜が振込期限となっており、これを過ぎてしまいますと、表題の大会についてはキャンセルとせざるを得ませんので、ご了承ください。


【確認のため、振込が完了し次第このメールに対して返信してください。】

内容は可能であれば「ご氏名、大会名、級、振込完了の旨」等を含めていただけると助かります。


その他ご相談や、確認事項がある場合も忌憚なくこのメールに返信いただければ幸いです。もしくは、副会長までご連絡ください。

よろしくお願いします。


慶應かるた会`;
  } else if (ifAfter){
    var body = 
`${name} 様


おはようございます。

このメールは、慶應かるた会のメールシステムが自動で送信しています。

現在、【${title}】につきまして、${splitName[0]}様からの振り込みを確認できておりません。（タイムラグがあるため、もし入れ違いになってしまっておりましたら申し訳ありません。）

【${date}】の夜が振込期限となっております。お早めの振込にご協力ください。


【確認のため、振込が完了し次第このメールに対して返信してください。】

内容は可能であれば「ご氏名、大会名、級、振込完了の旨」等を含めていただけると助かります。


その他ご相談や、確認事項がある場合も忌憚なくこのメールに返信いただければ幸いです。もしくは、副会長までご連絡ください。

よろしくお願いします。


慶應かるた会`
  }
  return body;
}


function quoteEmail(threadTitle) {
  Logger.log("quoteEmail " + "threadTitle" + threadTitle);
  var threads = GmailApp.search(threadTitle);
  
  if (threads.length > 0) {
    for (var i=0;i<threads.length;i++) {
      if(threads[i].getMessages()[0].getSubject().replace("Fwd: ","") === "第42回東京吉野会大会C級　案内"){
        var mentionedMessage = threads[i].getMessages()[0];
      }
    }
    if(!mentionedMessage){//mentionedMessageが定義されなかった、すなわち案内が複数の級をまとめて出している場合
      var gradePattern = /[A-Z]+級/;
      var d = threadTitle.match(gradePattern).map(function(grade){
        return grade.replace("級","");
      });
      Logger.log(d);
      for (var i=0;i<threads.length;i++) {
        if(threads[i].getMessages()[0].getSubject().replace(threads[i].getMessages()[0].getSubject().match(gradePattern)[0],"").replace("Fwd: ","") !== threadTitle.replace(threadTitle.match(gradePattern),""))continue;
        Logger.log(threads[i].getMessages()[0].getSubject());
        var c = threads[i].getMessages()[0].getSubject().match(gradePattern).map(function(grade) {
          return grade.replace("級","");
        });
        if(c[0].includes(d[0])){
          var mentionedMessage = threads[i].getMessages()[0];
        };
      }
    };    
    if(!mentionedMessage){
      Logger.log("スレッドが見つかりませんでした。"+threadTitle);
      return "";
    }
    Logger.log("スレッドが見つかりました。"+threadTitle);
    
    var originalBody = mentionedMessage.getBody();

    // <br> および <br/> を \n に変換
    var step1 = originalBody.replace(/<br\s*[\/]?>/gi, "\n");

    // 改行が入る可能性がある他のHTMLタグでの処理
    var step2 = step1.replace(/<\/(p|div|li|h[1-6])>/gi, "\n");

    // その他のHTMLタグを削除
    var step3 = step2.replace(/<\/?[^>]+(>|$)/g, "");
    
    // 連続する\nが3つ以上あれば、2つに置換
    var newBody = step3.replace(/\n{3,}/g, "\n\n");

    //var newBody = originalBody.replace(/<br\s*[\/]?>/gi, "\n").replace(/<\/?[^>]+(>|$)/g, "");
    return newBody;
  } else {
    Logger.log("スレッドが見つかりませんでした。");
    return "";
  }
}

function createEmailBody(tournamentName, grades, participantList, tomorrowDateStr, formLink, quotedEmailContent) {
  var emailBody = /**会長の名前 */
`おはようございます。

このメールは、慶應かるた会のメールシステムにより自動で送信されています。

こちらは、${tournamentName}${grades}のリマインダーです。

${participantList}
これから参加表明をされる方は、明日${tomorrowDateStr}までに以下のリンクからフォームにご回答ください。
${formLink}

よろしくお願いします。

以下、先日の本件に関するメールのコピーです。
----------
<blockquote style="border-left: 3px solid #ccc; padding-left: 20px; margin-left: 0; margin-right: 0;">
${quotedEmailContent}
</blockquote>
----------`;
  
  return emailBody;
}
function removeEmptyRows(data) {
  return data.filter(function(row) {
    return !row.every(function(cell) {
      return cell === "";
    });
  });
}
function convertToHtml(text) {
  return text.replace(/\n/g, '<br>');
}

function sendTestMails(emailSheet,row,now,rowNum) {//平時は使わない
  Logger.log("テストメールの送信を開始します。");
  var to = "tomoya72ice@keio.jp,tomoya.hirata@wing.ocn.ne.jp"
  //var to = emailSheet.getRange("I"+1).getValue();
  //var bcc = emailSheet.getRange("I"+2).getValue();
  var testMailSubject = "テストメール"
  var testHtmlBody = convertToHtml(testMailBody);
  Logger.log(testMailBody);
  Logger.log(testHtmlBody);
  
  if (now.getTime() >= targetDate.getTime() && now.getTime() - targetDate.getTime() <= 120000) {//2分までの誤差を許容する
    // メールを送信
    /*
    MailApp.sendEmail({
      to: to,
      //bcc: bcc,
      name: "慶應かるた会",
      subject: testMailSubject,
      body: testMailBody,
      htmlBody: testHtmlBody
    });
    Logger.log("送信を完了しました");
    // 送信完了を記録
    */
  }

}

function sendEmailAdmin() {
  var ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var admin = ss.getSheetByName("メール管理").getRange("J2").getValue();
  if(admin !== true){
    ui.alert('確認','管理者権限が無効です。',ui.ButtonSet.OK);
    return;
  }
  if(ui.alert(
    '確認【重要】',
    'この関数は下書きの作成ではなく、即時にメールを送信します。進む場合は「OK」を押してください。\n押し間違えた場合は「いいえ」を押して戻ってください。',
    ui.ButtonSet.YES_NO
  ) === ui.Button.NO)return;

  const createEmailSheet = ss.getSheetByName("案内メール作成");
  var data = createEmailSheet.getDataRange().getValues();
  var to = data[0][10];
  var bcc = data[1][10];
  var subject = data[54][1];
  var emailBody = data[54][3];

  if(ui.alert(
    '確認',
    '宛先: '+ to + "\n" +
    "bcc: " + bcc + "\n" +
    "件名: " + subject + "\n" +
    "本文: \n" + emailBody + "\n" +
    "という内容で送信します。\n" + 
    "よろしい場合は「OK」を押してください。「いいえ」を押すと何もせずに戻ります。",
    ui.ButtonSet.YES_NO
  ) === ui.Button.NO)return;

  MailApp.sendEmail({
      to: to,
      bcc: bcc,
      name: "慶應かるた会",
      subject: subject,
      body: emailBody,
      htmlBody: convertToHtml(emailBody)
    });
  Logger.log("送信を完了しました");
    // 送信完了を記録
}

function updateParticipantNames(participantListByGrade, participantsByLastName) {
  for (var grade in participantListByGrade) {
    participantListByGrade[grade] = participantListByGrade[grade].map(function(fullName) {
      return getUpdatedName(fullName, participantsByLastName);
    });
  }
  return participantListByGrade;
}

function updatePaidListNames(paidList, participantsByLastName) {
  return paidList.map(function(fullName) {
    return getUpdatedName(fullName, participantsByLastName);
  });
}

function getUpdatedName(fullName, participantsByLastName) {
  var lastName = fullName.split(" ")[0];
  var firstNameLetter = fullName.split(" ")[1] ? fullName.split(" ")[1][0] : "";

  var firstNames = [...new Set(participantsByLastName[lastName])].map(function(name) {
    return name.split(" ")[1] ? name.split(" ")[1][0] : ""; // 各名前の下の名前の初めの文字
  });

  if (firstNames.length === 1) {
    return lastName; // 名字のみ
  } 

  var nameOccurrences = firstNames.filter(function(letter) {
    return letter === firstNameLetter;
  });
  var a = nameOccurrences.length;
  if (a === 1) {
    return lastName + (firstNameLetter ? firstNameLetter : ""); // 名字 + 下の名前の初文字（存在する場合）
  } else {
    return fullName.replace(" ", ""); // フルネーム（スペース無し）
  }
}