function doGet() {
  var template = HtmlService.createTemplateFromFile('hp');
  template.data = getSpreadsheetData();
  return template.evaluate().setTitle('大会案内');
}

function getSpreadsheetData() {
  var ss = SpreadsheetApp.openById("*******************");
  var emailSheet = ss.getSheetByName("メール管理");
  var calendarSheet = ss.getSheetByName("カレンダー");

  // データの取得と加工
  var emailData = emailSheet.getDataRange().getValues();
  var calendarData = calendarSheet.getDataRange().getValues();
  var results = [];
  for(var i=0;i<calendarData.length;i++) {
    if(isOneDayLaterAfterNow(calendarData[i][3])) {
      for(j=0;j<emailData.length;j++) {
        if(emailData[j][0] + emailData[j][1] === calendarData[i][0] && emailData[j][3] === "リマインダー") {
          var body = calendarData[i][15];
          var oneDayLater = new Date(calendarData[i][3]);
          oneDayLater.setDate(oneDayLater.getDate() + 1);
          try {
            var day = Utilities.formatDate(calendarData[i][14],"JST","yyyy-MM-dd");
          } catch(e) {
            var day = calendarData[i][14].replace("/","-").replace("/","-");
          }
          results.push([
            day,
            calendarData[i][0],
            body,
            Utilities.formatDate(oneDayLater,"JST","yyyy-MM-dd"),
            emailData[j][5],
            "申込前"]);
        }
      }
    } else if (isOneDayLaterAfterNow(calendarData[i][14])) {
      for(j=0;j<emailData.length;j++) {
        if(emailData[j][0] + emailData[j][1] === calendarData[i][0] && emailData[j][3] === "リマインダー") {
          var body = calendarData[i][15];
          var oneDayLater = new Date(calendarData[i][3]);
          oneDayLater.setDate(oneDayLater.getDate() + 1);
          try {
            var day = Utilities.formatDate(calendarData[i][14],"JST","yyyy-MM-dd");
          } catch(e) {
            var day = "";
          }
          results.push([
            day,
            calendarData[i][0],
            body,
            Utilities.formatDate(oneDayLater,"JST","yyyy-MM-dd"),
            emailData[j][5],
            "申込後"]);
        }
      }
    }
  }
  Logger.log(results);
  return results;
}
function checkLogin(username,password) {
  if (username === "admin" && password === "keio") {
    return "success";
  } else {
    return "failure";
  }
}


function isOneDayLaterAfterNow(date) {
  if(date === "")return false;
  if(typeof(date) === "string")date = date.replace(/\//g, "-").replace(/など/g, "");
  var oneDayLater = new Date(date);
  oneDayLater.setDate(oneDayLater.getDate() + 1);
  oneDayLater.setHours(23, 59, 0, 0);

  var now = new Date();
  return oneDayLater > now;
}

function showDialog() {
  var html = HtmlService.createHtmlOutputFromFile('CheckboxDialog')
      .setWidth(400)
      .setHeight(400);
  SpreadsheetApp.getUi()
      .showModalDialog(html, '案内メール');
}

function showDialog2() {
  var html = HtmlService.createHtmlOutputFromFile('CheckboxDialog2')
      .setWidth(400)
      .setHeight(400);
  SpreadsheetApp.getUi()
      .showModalDialog(html, '出場者確定のお知らせ');
}

function processOK(formObject) {
  // すべてのチェックボックスがチェックされているか確認
  var allChecked = formObject.option1 && formObject.option2 && formObject.option3;

  if (allChecked) {
    // すべてのチェックボックスがチェックされている場合の処理
    Logger.log('すべてのチェックボックスがチェックされました。');
    createDraft();
  } else {
    // すべてのチェックボックスがチェックされていない場合の処理
    Logger.log('すべてのチェックボックスがチェックされていません。');
    var ui = SpreadsheetApp.getUi();
    ui.alert('確認','必ず事前にすべての事項を確認してください。',ui.ButtonSet.OK);
    return;
  }
}

function processOK2(formObject) {
  // すべてのチェックボックスがチェックされているか確認
  var allChecked = formObject.option4 && formObject.option5 && formObject.option6;

  if (allChecked) {
    // すべてのチェックボックスがチェックされている場合の処理
    Logger.log('すべてのチェックボックスがチェックされました。');
    createDraft2();
  } else {
    // すべてのチェックボックスがチェックされていない場合の処理
    Logger.log('すべてのチェックボックスがチェックされていません。');
    var ui = SpreadsheetApp.getUi();
    ui.alert('確認','必ず事前にすべての事項を確認してください。',ui.ButtonSet.OK);
    return;
  }
}

function processBack() {
  Logger.log('戻るボタンが押されました');
  // 戻るボタンの処理をここに記述
}


