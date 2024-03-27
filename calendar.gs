function calendarTrigger() {
  Logger.log("calendarTrigger");
  var calendarSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('カレンダー');
  var data = calendarSheet.getRange(1,1,calendarSheet.getLastRow(),13).getValues();
  var moshikomiReminder = data[0][2] * 24 * 60 + (8 - data[0][5]) * 60;
  var hurikomiReminder = data[0][8] * 24 * 60 + (8 - data[0][11]) * 60; 
  for(i=2;i<data.length;i++) {
    var title = data[i][0];
    if(title === "")continue;
    if(data[i][12] === "完了")continue;
    for(j=0;j<data[i].length;j++){
      var status = data[1][j];
      if(data[i][j] === "")continue;
      if(typeof(data[i][j]) === "string"){
        continue;
      }
      switch (j){
        case 3:
          var foundEvents = searchEventsByTitle(title,status);
          if(data[i][6] === "済"){
            deleteAllEvents(foundEvents);
            break;
          }
          if(foundEvents.length === 0 || foundEvents.length >= 2){
            deleteAllEvents(foundEvents);
          } else if(!isDateDifferent(foundEvents,data[i][j],660)){
            continue;
          } else {
            deleteAllEvents(foundEvents);
          }
          createCalendarEvent(title,data[i][j],data[i][j],status);
          break;
        case 4:
          if(typeof(data[i][j+1]) === "string"){
            continue;
          }
          var foundEvents = searchEventsByTitle(title,status);
          if(data[i][6] === "済"){
            deleteAllEvents(foundEvents);
            break;
          }
          if(foundEvents.length === 0 || foundEvents.length >= 2){
            deleteAllEvents(foundEvents);
          } else if(!isDateDifferent(foundEvents,data[i][j],5)){
            continue;
          } else {
            deleteAllEvents(foundEvents);
          }
          createCalendarEvent(title,data[i][j],data[i][j+1],status);
          break;
        case 5:
          var foundEvents = searchEventsByTitle(title,status);
          if(data[i][6] === "済"){
            deleteAllEvents(foundEvents);
            break;
          }
          if(foundEvents.length === 0 || foundEvents.length >= 2){
            deleteAllEvents(foundEvents);
          } else if(!isDateDifferent(foundEvents,data[i][j],moshikomiReminder)){
            continue;
          } else {
            deleteAllEvents(foundEvents);
          }
          createCalendarEvent(title,data[i][j-1],data[i][j],status);
          break;
        case 8:
          var foundEvents = searchEventsByTitle(title,status);
          if(data[i][11] === "済"){
            deleteAllEvents(foundEvents);
            break;
          }
          if(foundEvents.length === 0 || foundEvents.length >= 2){
            deleteAllEvents(foundEvents);
          } else if(!isDateDifferent(foundEvents,data[i][j],0)){
            continue;
          } else {
            deleteAllEvents(foundEvents);
          }
          createCalendarEvent(title,data[i][j],data[i][j],status);
          break;
        case 9:
          if(typeof(data[i][j+1]) === "string"){
            continue;
          }
          var foundEvents = searchEventsByTitle(title,status);
          if(data[i][11] === "済"){
            deleteAllEvents(foundEvents);
            break;
          }
          if(foundEvents.length === 0 || foundEvents.length >= 2){
            deleteAllEvents(foundEvents);
          } else if(!isDateDifferent(foundEvents,data[i][j],0)){
            continue;
          } else {
            deleteAllEvents(foundEvents);
          }
          createCalendarEvent(title,data[i][j],data[i][j+1],status);
          break;
        case 10:
          var foundEvents = searchEventsByTitle(title,status);
          if(data[i][11] === "済"){
            deleteAllEvents(foundEvents);
            break;
          }
          if(foundEvents.length === 0 || foundEvents.length >= 2){
            deleteAllEvents(foundEvents);
          } else if(!isDateDifferent(foundEvents,data[i][j],hurikomiReminder)){
            continue;
          } else {
            deleteAllEvents(foundEvents);
          }
          createCalendarEvent(title,data[i][j-1],data[i][j],status);
          break;
        default:
          continue;
      }
    }
  }
}

function createCalendarEvent(title, startTime, endTime, status) {
  Logger.log("createCalendarEvent");
  //色　1青2緑3紫4オレンジ5黄色6水色7水色8水色9紺色10緑11赤12水色
  //if(startTime === "")return;
  //if(endTime === "")return;
  var calendar = CalendarApp.getDefaultCalendar();
  var calendarSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("カレンダー");
  var firstRow = calendarSheet.getRange(1,1,1,12).getValues();
  var reminderMoshikomiDay = firstRow[0][2];
  var reminderMoshikomiHour = firstRow[0][5];
  var reminderHurikomiDay = firstRow[0][8];
  var reminderHurikomiHour = firstRow[0][11];

  if(status === 'リマインダー'){
    var colorId = '3';//紫
    var description = '名字と名前の間の空白があるか、登録級が合っているかなどを確認してください。また、同一人物による2回以上の入力は、極力片方の行を削除するなどの対処をしてください。';
    startTime.setHours(8);
    var endTime = new Date(endTime.getTime());
    endTime.setHours(8);
    var event = calendar.createEvent('【'+ status + '】' + title,startTime,endTime,{description: description});

    event.setColor(colorId);
    event.addPopupReminder(60*11); // 前日の21時
  }
  else if (status === '申込開始') {
    var colorId = '4';//オレンジ
    var endTimeStr = endTime === "" ? "" : Utilities.formatDate(endTime,"JST","yyyy年MM月dd日");
    var description = '会内締め切りを過ぎました。本締め切りは' + endTimeStr + 'です。お早めに申込を完了してください。';
    
    var newStartTime = new Date(startTime.getTime()
    // + 24 * 60 * 60 * 1000
    );
    newStartTime.setHours(6);
    newStartTime.setMinutes(0);
    newStartTime.setSeconds(0);

    var event = calendar.createEvent('【'+ status +'】' + title,newStartTime,newStartTime,{description: description});
    
    event.setColor(colorId);
    event.addPopupReminder(6*60);
    event.addPopupReminder(5);
  }
  else if (status === '本申込期限'){
    var colorId = '11';//赤
    endTime.setHours(8);
    var deadline = Utilities.formatDate(endTime,"JST","yyyy年MM月dd日");
    var description = deadline + 'が申込本締め切りです。遅れないように必ず申込を完了してください。事情がある場合は大会案内係に共有し、会長に連絡してください。';
    var event = calendar.createEvent('【'+ status + '】' + title, endTime,endTime,{description: description});

    event.setColor(colorId);
    event.addPopupReminder(60);
    event.addPopupReminder(24 * reminderMoshikomiDay * 60 + (8-reminderMoshikomiHour) * 60);
  }
  else if (status === "振込開始") {
    var colorId = '8';//水色
    var endTimeStr = endTime === "" ? "" : Utilities.formatDate(endTime,"JST","yyyy年MM月dd日");
    var description = '出場者が確定しました。メーリスに流れている名簿を確認し、抽選に落ちている人にはメールが送信されないように「振り込み済みか」の欄に何かの文字を入れてください。本締め切りは' + endTimeStr + 'です。定期的に確認し、全員の振込が確認できた場合は「カレンダー」のシートに済と入れてください。';
    
    startTime.setHours(8);
    var event = calendar.createEvent('【'+ status + '】' + title, startTime,startTime,{description: description});

    event.setColor(colorId);
    event.addPopupReminder(60);
  }
  else if (status === '本振込期限') {
    var colorId = '9';//紺色
    endTime.setHours(8);
    var deadline = Utilities.formatDate(endTime,"JST","yyyy年MM月dd日");
    var description = deadline + 'が振込の本締め切りです。忘れずに振込を完了してください。事情がある場合は大会案内係に共有し、会長に連絡してください。';
    var event = calendar.createEvent('【' + status + '】' + title, endTime,endTime,{description: description});
    event.setColor(colorId);
    event.addPopupReminder(60);
    event.addPopupReminder(24 * reminderHurikomiDay * 60 + (8-reminderHurikomiHour) * 60);
  }
  else if (status === '振込催促メール') {
    var colorId = '2';//緑
    startTime.setHours(8);
    var description = "振込催促メールを" + Utilities.formatDate(startTime,"JST","yyyy年MM月dd日 HH時") + "に送信します。齟齬がないよう、最終的な確認をお願いします。また、返事はそのメールへの返信（もしくは副会長への連絡）で統一していますので、振込を確定する前に確認してください。";
    var event = calendar.createEvent('【' + status + '】'+ title,startTime,startTime,{description: description});
    event.setColor(colorId);
    event.addPopupReminder(11*60);
    event.addPopupReminder(30);
  }
}


function isDateDifferent(event,time,reminder){
  var start = event[0].getStartTime();
  var reminderTime = event[0].getPopupReminders();

  var ifTimeDifferent = start.getDate() !== time.getDate() || start.getMonth() !== time.getMonth();
  if(ifTimeDifferent)return true;

  for (var i=0;i<reminderTime.length;i++) {
    if([5,30,60,360,660,reminder].includes(reminderTime[i])) {
      continue;
    } else {
      return true;
    }
  }
  return false;
}

function deleteAllEvents(events) {
  if(events.length === 0)return;
  for (var i = 0; i < events.length; i++) {
    try {
      var eventName = events[i].getTitle();
      events[i].deleteEvent();
      Logger.log(eventName + "を削除しました。");
    } catch (e) {
      Logger.log("Error deleting event: " + e.toString());
    }
  }
  Logger.log(events.length + " events deleted.");
  return;
}

function colorDate(date){
  if(date === "")return '#ffffff';
  if(typeof(date) === 'string'){
    var date = date.replace("など","");
    if(!date.includes("/")){
      return '#ffffff';
    };
  }
  var background = '#fff2cc';
  var cellDate = new Date(date);
  var today = new Date();
  if (!isNaN(cellDate.getTime())) { // 有効な日付のみ処理
    if (cellDate < today) {
      // 1日以上過ぎている場合は薄い灰色
      return '#cccccc';
    } else if (cellDate >= today && cellDate <= new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)) {
      // 当日～3日後までは薄い赤色
      return '#ffcccc';
    } else {
      // それ以外は塗りつぶしをクリア
      return background;
    }
  }
}

function updateSheetColors() {
  Logger.log("updateSheetColors");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('カレンダー');
  var range = sheet.getRange(3, 1, sheet.getLastRow(), 15); // D列からI列までの範囲を指定
  var values = range.getValues(); // セルの値を取得

  // 現在の日付（時間を無視）
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // 各セルをループして色を設定
  for (var i = 0; i < values.length; i++) {
    if(values[i][12] !== "完了" && values[i][0] !== ""){
      memo(values[i]);
    }

    for (var j = 0; j < values[i].length; j++) {
      if(values[i][j] === "")continue;
      var background = '#fff2cc';
      var cellDate = new Date(values[i][j]);
      if (!isNaN(cellDate.getTime())) { // 有効な日付のみ処理
        if (cellDate < today) {
          // 1日以上過ぎている場合は薄い灰色
          range.getCell(i + 1, j + 1).setBackground('#cccccc');
        } else if (cellDate >= today && cellDate <= new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)) {
          // 当日～3日後までは薄い赤色
          range.getCell(i + 1, j + 1).setBackground('#ffcccc');
        } else {
          // それ以外は塗りつぶしをクリア
          range.getCell(i + 1, j + 1).setBackground(background);
        }
      }
    }
  }
}

function memo(row){
  var title = row[0];
  Logger.log(title + "のメモ");
  var announce = row[2];
  var reminder = row[3];
  var moshikomi = row[5];
  var raffle = row[7];
  var hurikomi = row[10];
  var memoCalendar = row[13];
  var tournamentDate = row[14];
  var tournamentSheet = SpreadsheetApp.openById("1KfxkE6RdW-u0AciuqGUMH9P1zeuOkBVa5Y6iTOzy6Hc").getSheetByName(title);
  var calendarSheet = SpreadsheetApp.openById("1KfxkE6RdW-u0AciuqGUMH9P1zeuOkBVa5Y6iTOzy6Hc").getSheetByName('カレンダー');
  var calendarData = calendarSheet.getDataRange().getValues();
  try{
    var count = tournamentSheet.getRange(1,1,1,tournamentSheet.getLastColumn()).getValues()[0].filter(function(cell) {
      return typeof(cell) === "number";
      })[0];    
  } catch(e) {
    Logger.log(title + "は削除されたシートだと思われます。");
    return;
  }
  
  var column = tournamentSheet.getRange(1,count+4,tournamentSheet.getLastRow(),3).getValues();
  while(column[column.length-1][0] === "") {
    column.pop();
  }
  Logger.log(column);
  var countA = 0; // 本申込期限
  var countB = 0; // 本振込期限
  var countC = 0; // メモ
  var countD = 0; // 大会の日時
  var countE = 0; // リマインダー
  var countF = 0; // 抽選日
  var countG = 0; // 案内が出された日

  for(var i=0;i<column.length;i++){
    if (column[i][0] === "申込開始日") {
      tournamentSheet.getRange(i+1,count+5).setBackground(colorDate(announce));
      column[i][1] = announce;
      countG++;
    } else if (column[i][0] === "リマインダー"){
      tournamentSheet.getRange(i+1,count+5).setBackground(colorDate(reminder));
      column[i][1] = reminder;
      countE++;
    } else if(column[i][0] === "本申込期限"){
      tournamentSheet.getRange(i+1,count+5).setBackground(colorDate(moshikomi));
      column[i][1] = moshikomi;
      countA++;
    } else if(column[i][0] === "抽選日"){
      tournamentSheet.getRange(i+1,count+5).setBackground(colorDate(raffle));
      column[i][1] = raffle;
      countF++;
    } else if(column[i][0] === "本振込期限"){
      tournamentSheet.getRange(i+1,count+5).setBackground(colorDate(hurikomi));
      column[i][1] = hurikomi;
      countB++;
    } else if(column[i][0] === '大会の日時') {
      tournamentSheet.getRange(i+1, count + 5).setBackground(colorDate(tournamentDate));
      column[i][1] = tournamentDate;
      countD++;
    } else if(column[i][0] === "メモ"){
      if (column[i][2] === "edited") {
        for(var j=0;j<calendarData.length;j++) {
          if(calendarData[j][0] === row[0]){
            calendarSheet.getRange(j+1,14).setValue(column[i][1]);
          }
        }
      } else {
        column[i][1] = memoCalendar;
      }
      column[i][2] = "";
      countC++;
    }
  }
  if(countG === 0)column.push(['申込開始日',announce,""]);
  if(countE === 0)column.push(['リマインダー',reminder,""]);
  if(countA === 0)column.push(['本申込期限',moshikomi,""]);
  if(countF === 0)column.push(['抽選日',raffle,""]);
  if(countB === 0)column.push(['本振込期限',hurikomi,""]);
  if(countD === 0)column.push(['大会の日時',tournamentDate,""]);
  if(countC === 0)column.push(['メモ',memoCalendar,""]);
  tournamentSheet.getRange(1,count+4,column.length,3).setValues(column);
}

function checkSentMail() {
  Logger.log("checkSentMail");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var calendarSheet = ss.getSheetByName("カレンダー");
  
  var queryAnnounce = 'subject:"案内" newer_than:60d'
  var threadsAnnounce = GmailApp.search(queryAnnounce);
  var gradePattern = /[A-Z]+級/;

  var calendarData = calendarSheet.getRange(2,1,calendarSheet.getLastRow() - 1,3).getValues();

  for (var i = 0; i < threadsAnnounce.length; i++) {
    var thread = threadsAnnounce[i];
    var messages = thread.getMessages(); // スレッド内の全メッセージを取得
    Logger.log(messages);
    // 各メッセージに対してループ
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      var subject = message.getSubject(); // メッセージの件名を取得
      // ここで件名に基づいた操作を行う
      // 例: 件名をログに記録
      Logger.log(subject);
      Logger.log(message);

      var modifiedSubject = subject.replace(/　案内/g, "").replace("Fwd: ","");
      if(gradePattern.test(modifiedSubject)) {
        for(var k=0;k<calendarData.length;k++) {
          if(calendarData[k][0] === "")continue;
          try {
            var ifTitleOk = titleCheck(calendarData[k][0],modifiedSubject);
          } catch(e){
            var ifTitleOk = false;
          }
          if(ifTitleOk){
            Logger.log(calendarData[k][0] + "を発見しました。");
            var rang = calendarSheet.getRange(k+2,2); // 2列目に移した。
            if(rang.getValue() === "")rang.setValue("済");
            calendarSheet.getRange(k+2,16).setValue(message.getPlainBody().replace(/\r\n|\n|\r/g, "<br>"));
          }
        }
      }
    }
  }
  /** 重要度が低く、また他に重要度の高い列ができたため、削除 2024/3/20
  Logger.log("出場者確定");
  var queryMembers = 'in:sent subject:"出場者確定" newer_than:30d'
  var threadsMembers = GmailApp.search(queryMembers);
  var gradePattern = /[A-Z]+級/;

  var calendarData = calendarSheet.getRange(2,1,calendarSheet.getLastRow() - 1,3).getValues();

  for (var i = 0; i < threadsMembers.length; i++) {
    var thread = threadsMembers[i];
    var messages = thread.getMessages(); // スレッド内の全メッセージを取得

    // 各メッセージに対してループ
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      var subject = message.getSubject(); // メッセージの件名を取得

      // ここで件名に基づいた操作を行う
      // 例: 件名をログに記録
      //Logger.log(subject);
      //Logger.log(message);
      var modifiedSubject = subject.replace(/　出場者確定のお知らせ/g, "");
      if(gradePattern.test(modifiedSubject)) {
        Logger.log(modifiedSubject);
        for(var k=0;k<calendarData.length;k++) {
          if(calendarData[k][0] === "")continue;
          try {
            var ifTitleOk = titleCheck(calendarData[k][0],modifiedSubject);
          } catch(e){
            var ifTitleOk = false;
          }
          if(ifTitleOk){
            var range = calendarSheet.getRange(k+2,3); // 3列目に移した。
            if(range.getValue() === "")range.setValue("済");
            found = true;
          }
        }
      }
    }
  }
  */
  updateSheetColors();
  calendarTrigger();
  Logger.log("maintainCashFlowSheet");
  maintainCashFlowSheet();
}
function titleCheck(calendarTitle,mailTitle){
  var calendarTitleGrade = calendarTitle.replace("級","").match(/[A-Z]+$/);
  var mailTitleGrade = mailTitle.replace("級","").match(/[A-Z]+$/);
  var calendarName = calendarTitle.replace(calendarTitleGrade[0],"");
  var mailName = mailTitle.replace(mailTitleGrade[0],"");
  
  if(calendarName !== mailName){
    return false;
  }

  var calendarSplit = calendarTitleGrade[0].split("");
  //var mailSplit = mailTitleGrade.split("");
  var count = calendarSplit.length;
  var result = 0;

  for (var i=0; i<calendarSplit.length; i++){
    if(mailTitleGrade[0].includes(calendarSplit[i])){
      result++;
    }
  }
  if(result === count){
    return true;
  } else {
    Logger.log("result" + result + "count" + count);
    return false;
  }
}
function searchEventsByTitle(searchTitle,status) {
  var calendar = CalendarApp.getDefaultCalendar(); // または特定のカレンダーIDを使用
  var now = new Date();
  var past = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  var future = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()); // 1年後までのイベントを検索
  var events = calendar.getEvents(past, future);
  var foundEvents = [];

  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (event.getTitle() === '【'+status+'】'+searchTitle) {
      // タイトルに検索文字列が含まれているイベントを見つけた場合
      foundEvents.push(event);
    }
  }

  return foundEvents;
}
function admin(date){
  Logger.log(date);
  ScriptApp.newTrigger('sendEmails')
      .timeBased()
      .at(date)
      .create();
}
function adminCalendarDelete() {
  var calendar = CalendarApp.getDefaultCalendar(); // または特定のカレンダーIDを使用
  var now = new Date();
  var past = new Date("1970-01-01");
  var future = new Date("2099-12-31"); // 遠い未来の日付
  var events = calendar.getEvents(past, future);

  for (var i = 0; i < events.length; i++) {
    try {
      events[i].deleteEvent();
    } catch (e) {
      Logger.log("Error deleting event: " + e.toString());
    }
  }
  Logger.log(events.length + " events deleted.");
}
