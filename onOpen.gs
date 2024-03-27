// スプレッドシートが開かれたときに実行される関数
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // カスタムメニューを追加
  ui.createMenu('☆大会フォーム')
      .addItem('【氏名をスペースで分ける】','divideName')
      .addItem('【データベースに登録する】','registerDatabase')
      .addItem('【データベースから出場した公認大会を確認する】','countMatches')
      .addItem('【重複している行を探す】','highlightDuplicateNames')
      .addItem('【この大会の催促メールを設定】','setPaymentReminders')
      .addItem('このシートを完了済みファイルに移動する','moveToDone')
      .addItem('※このシートとフォームを削除※', 'deleteSheet')
      .addToUi();
  ui.createMenu('☆メール管理')
      .addItem('トリガー全削除 → 必要なものを再設定','deleteAllTriggers')
      .addItem('メールの下書きを作成（案内）','showDialog')
      .addItem('メールの下書きを作成（出場者確定のお知らせ）','showDialog2')
      .addItem('メールの下書きを作成','createDraft3')
      .addItem('メールの下書きを作成（読手講習会）','createDraft4')
      .addItem('【メール送信】','sendEmailAdmin')
      .addItem('※トリガー全消し※','deleteAllTriggersNoUndo')
      .addToUi();
  ui.createMenu('☆カレンダー')
      .addItem('手動カレンダー更新','calendarTrigger2')
      .addItem('※カレンダーの予定全消し※','adminCalendarDelete2')
      .addToUi();
}
function divideName() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var count = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].filter(function(cell) {
        return typeof(cell) === "number";
      })[0];
  var nameData = sheet.getDataRange().getValues().filter(function(row) {
    return row[2] !== "" && typeof(row[2]) === "string" && (row[2].includes(" ") || row[2].includes("　"));
  }).map(function(row) {
    var parts = row[2].split(/ +|　+/);
    return [parts[0],parts[1]];
  });
  sheet.getRange(2,count+4,nameData.length,2).setValues(nameData);
}
function calendarTrigger2() {
  var ui = SpreadsheetApp.getUi();
  if(ui.alert(
    '確認',
    '手動でGoogleカレンダーを更新します。\nよろしい場合は「OK」を押してください。\n時間を調整したい場合は直接googleカレンダーから調整するか、管理者に相談してください。',
    ui.ButtonSet.YES_NO
  ) === ui.Button.NO)return;
  calendarTrigger();
}
function adminCalendarDelete2() {
  var ui = SpreadsheetApp.getUi();
  if(ui.alert(
    '確認',
    'Googleカレンダーに登録されている全ての予定を削除します。\nよろしい場合は「OK」を押してください。「いいえ」を押すと何もせず戻ります。\n再度「手動カレンダー更新」をすればすぐに必要な分は設定されるので大したことはないです。',
    ui.ButtonSet.YES_NO
  ) === ui.Button.NO)return;
  adminCalendarDelete();
}
function undoPaymentReminders() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheet = ss.getActiveSheet();
  var sheet = ss.getSheetByName("メール管理");
  var sheetName = ss.getActiveSheet().getName();

  if(ui.alert(
    '確認',
    sheetName + 'の振込確認メールを取り消します。よろしい場合は「OK」を押してください。',
    ui.ButtonSet.YES_NO
  ) === ui.Button.NO)return;
  
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(6,1,lastRow-5,9).getValues();

  for (i=0;i<data.length;i++) {
    var row = data[i];
    var name = row[0]+row[1];
    if(name === sheetName && (row[3] === "管理者通知" || row[3] === "振込確認")){
      sheet.deleteRow(i+6);
      var count = tournamentSheet.getRange(1,1,1,tournamentSheet.getLastColumn()).getValues()[0].filter(function(cell) {
        return typeof(cell) === "number";
      })[0];
      var columnData = currentSheet.getRange(2, count + 4, currentSheet.getLastRow(),1).getValues();
      for (var i = 0; i < columnData.length; i++) {
        if (columnData[i][0] === "設定済み") {
          currentSheet.getRange(i+2,count+4).setValue("未設定");
          break;
        }
      }
    }
  }
}

// シートを削除する関数
function deleteSheet(state=false) {
  // アクティブなスプレッドシートとシートを取得
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var sheetName = sheet.getName();
  var ui = SpreadsheetApp.getUi();
  
  if(sheetName == "フォーム作成" || sheetName == "メール管理") {
    if(state === false){
      ui.alert(
        '注意',
        '「メール管理」または「フォーム作成」のシートを開いた状態ではこの関数を実行することはできません。\n削除したいシートを開いた状態で実行してください。',
        ui.ButtonSet.OK
      )
    }
    return;
  }

  if(state === false) {
    if (ui.alert(
      '確認',
      'このシートと、元となるGoogleフォームがゴミ箱に移動されます。（消去はされません。）\nよろしい場合は「OK」を押してください。',
      ui.ButtonSet.YES_NO
    ) == ui.Button.NO) return;
  }
  var count = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].filter(function(cell) {
      return typeof(cell) === "number";
    })[0];
  Logger.log(count);
  // シートのH1セルからフォームのIDを取得
  var formId = sheet.getRange(1,count + 4).getValue();
  
  // フォームを取得
  var form = FormApp.openById(formId);
  DriveApp.getFileById(formId).setTrashed(true);
  
  // "ゴミ箱用スプレッドシート"を取得
  var trashSs = SpreadsheetApp.openById("1v8BmrAEt-DfcgwksxyHpVIveP7sjC26K0mGltbdBIZs");
  
  // フォームの回答先を"ゴミ箱用スプレッドシート"に変更
  form.setDestination(FormApp.DestinationType.SPREADSHEET, trashSs.getId());
  
  // アクティブなシートを削除
  ss.deleteSheet(sheet);
}

function deleteAllTriggers(state=false) {
  if(state === false) {
    try{
      var ui = SpreadsheetApp.getUi();
      if (ui.alert(
        '確認',
        '送信済みで不要となっているリマインダー、振込確認メール、管理者通知のトリガーを全て消します。未送信のものについては自動で再設定します。\nよろしい場合は「OK」を押してください。',
        ui.ButtonSet.YES_NO
      ) == ui.Button.NO) return;
    } catch(e){}
  }
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    if(triggers[i].getHandlerFunction() === "deleteAllTriggers")continue;
    if(triggers[i].getHandlerFunction() === "checkSentMail")continue;
    if(triggers[i].getHandlerFunction() === "onEditTrigger")continue;
    if(triggers[i].getHandlerFunction() === "memoForm")continue;
    if(triggers[i].getHandlerFunction() === "updateBalances")continue;
    ScriptApp.deleteTrigger(triggers[i]);
  }

  var emailSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("メール管理");
  var data = emailSheet.getRange(6,1,emailSheet.getLastRow(),9).getValues();
  for(var i=0;i<data.length;i++){
    if(data[i][2] !== ""){
      if(data[i][6] === "済" && data[i][7] !== "済"){
        ScriptApp.newTrigger('sendEmails').timeBased().at(data[i][2]).create();
      }
    }
  }
}
function deleteAllTriggersNoUndo() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert(
    '確認',
    'すべてのトリガーを削除します。\nよろしい場合は「OK」を押してください。',
    ui.ButtonSet.YES_NO
  ) == ui.Button.NO) return;
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function moveToDone(state=false){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var sheetName = sheet.getName();
  var ui = SpreadsheetApp.getUi();
  if(state===false) {

    if(sheetName == "フォーム作成" || sheetName == "メール管理") {
      ui.alert(
        '注意',
        '「メール管理」または「フォーム作成」のシートを開いた状態ではこの関数を実行することはできません。\n削除したいシートを開いた状態で実行してください。',
        ui.ButtonSet.OK
      )
      return;
    }
    if (ui.alert(
      '確認',
      'この大会のフォームを完了済みのフォルダに移し、このシートは非表示にします。よろしい場合は「OK」を押してください。\n「いいえ」を押すと何もせずに戻ります。',
      ui.ButtonSet.YES_NO
    ) == ui.Button.NO) return;
  }
  var count = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].filter(function(cell) {
      return typeof(cell) === "number";
    })[0];
  Logger.log(count);
  // シートのH1セルからフォームのIDを取得
  var formId = sheet.getRange(1,count + 4).getValue();
  var formFile = DriveApp.getFileById(formId);
  try{
    var folder = DriveApp.getFolderById("1SXIBU6JgNwd2e5kxjoDmYX8mE5hQg_US");
  } catch(e) {
    Logger.log(e.message);
    var folder = DriveApp.getFolderById("1kscn_pf7sqC7c4TuAABJtJvlovofl9ma");
  }
  Logger.log(folder.getName());
  formFile.moveTo(folder);
  sheet.hideSheet();

  var calendarSheet = ss.getSheetByName("カレンダー");
  var calendarColumn = calendarSheet.getRange(1,1,calendarSheet.getLastRow(),1).getValues();
  for(var i=2;i<calendarColumn.length;i++) {
    if(calendarColumn[i][0] === sheetName){
      calendarSheet.getRange(i+1,13).setValue("完了");
    }
  }
}

function onEditTrigger(e){
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  const admin = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("メール管理").getRange("J2").getValue();
  if(sheetName === "メール管理") {
    if(range.getRow() > 5) {
      sheet.getRange(2,3).setValue(range.getRow());
    } else if(range.getA1Notation() === 'J2' && range.getValue() === true){
      ScriptApp.newTrigger('clearJ2Cell')
        .timeBased()
        .after(20 * 10 * 1000) // 10分後
        .create();
    } else if (range.getA1Notation() === 'J4' && range.getValue() === "do") {
      if(admin !== true) {  
        range.setValue("管理者権限が無効です。");
        return;
      } else {
        try{
          deleteAllTriggers(state=admin);
          range.setValue("");
          clearJ2Cell();
        } catch(e) {
          range.setValue(e.message);
          return;
        }
      }
    } else if (range.getA1Notation() === 'K4' && range.getValue() === "do") {
      var input = sheet.getRange('K2').getValue();
      setReminders(state=true,input=input);
    }   
  } else if (sheetName === "カレンダー") {
    if(range.getRow() === 1) {
      calendarTrigger();
    } else if (range.getColumn() === 12 && range.getValue() === '済') {
      recordTransactionsFromCalendar(range);
    } else if (range.getColumn() === 13 && range.getValue() === "完了") {
      var title = sheet.getRange(range.getRow(), 1).getValue();
      var emailSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("メール管理");
      var emailData = emailSheet.getDataRange().getValues();
      Logger.log(title + " メール管理調整");

      // 削除すべき行のインデックスを格納する配列
      var deleteIndex = [];
      for (var i = 0; i < emailData.length; i++) {
        // [0] + [1]の値がtitleに等しい場合、その行のインデックスを保存
        if (emailData[i][0] + emailData[i][1] === title && emailData[i][7] === "済") {
          deleteIndex.push(i + 1); // スプレッドシートの行は1から始まるので、1を加算
        }
      }

      // 後ろから削除していく
      for (var i = deleteIndex.length - 1; i >= 0; i--) {
        emailSheet.deleteRow(deleteIndex[i]);
      }    
    }
  } else if (sheetName === "案内メール作成") {
    var aboveCell = sheet.getRange(range.getRow() -1,range.getColumn()).getValue();
    if(aboveCell === "createDraft" && range.getValue() === "do") {
      var input = sheet.getRange('J6:J10').getValues();
      if(input[0][0] === "" || input[1][0] === "" || input[2][0] === "") {
        range.setValue("下の欄に何かしらの文字を入れてください。");
        return;
      } else {
        try{
          createDraft(state=true,input1=input[3][0],input2=input[4][0]);
          range.setValue("");
          sheet.getRange('J6:J10').setValues([[""],[""],[""],[""],[""]]);
        } catch(e) {
          range.setValue(e.message);
        }
      }
    } else if (aboveCell === "createDraft2" && range.getValue() === "do") {
      var input = sheet.getRange('J39:J42').getValues();
      if(input[0][0] === "" || input[1][0] === "" || input[2][0] === "") {
        range.setValue("下の欄に何かしらの文字を入れてください。");
        return;
      } else {
        try{
          createDraft2(state=true,input=input[3][0]);
          range.setValue("");
          sheet.getRange('J39:J42').setValues([[""],[""],[""],[""]]);
        } catch(e) {
          range.setValue(e.message);
        }
      }
    }
  } else if (sheetName === "フォーム作成") {
    var aboveCell = sheet.getRange(range.getRow()-1,range.getColumn()).getValue();
    if(aboveCell === "createFormAndSheet" && admin === true) {
      createFormAndSheet(state=true);
    }
  } else if (sheetName === "出納管理") {
    if(sheet.getRange(range.getRow() - 1,range.getColumn()).getValue() === "appendCashFlow" && range.getValue() === "do") {
      appendCashFlow(state=true);
    } 
  } else { // 大会フォーム
    var aboveCell = range.getRow() === 1 ? "" : sheet.getRange(range.getRow()-1,range.getColumn()).getValue();
    var leftCell = range.getColumn() === 1 ? "" : sheet.getRange(range.getRow() ,range.getColumn()-1).getValue();
    if(range.getValue() === "済"){
      recordTransactionEach(range);
    } else if(aboveCell === "registerDatabase" && range.getValue() === "do") {
      try{
        range.setValue('実行中');
        var kounin = sheet.getRange(range.getRow(),range.getColumn() + 1).getValue() === "" ? true : false;
        registerDatabase(state=true,kounin=kounin);
      } catch(e) {
        range.setValue(e.message);
      }
    } else if (aboveCell === "countMatches" && range.getValue() === "do") {
      try {
        countMatches(state=true);
        range.setValue('done');
      } catch(e) {
        range.setValue(e.message);
      }
    } else if(aboveCell === "setPaymentReminders" && range.getValue() === "do") {
      try{
        if(admin !== true)return;
        setPaymentReminders(name=sheetName,state=admin);
        range.setValue("");
        clearJ2Cell();
      } catch(e) {
        range.setValue(e.message);
      }
    }else if(aboveCell === "moveToDone" && range.getValue() === "do") {
      try{
        if(admin !== true)return;
        moveToDone(state=admin);
        clearJ2Cell();
      } catch(e){
        range.setValue(e.message);
      }
    }
     else if(aboveCell === "deleteSheet" && range.getValue() === "do") {
      try{
        if(admin !== true)return;
        deleteSheet(state=admin);
        clearJ2Cell();
      } catch(e){
        range.setValue(e.message);
      }
    } else if (leftCell === "メモ") {
      Logger.log("edited");
      sheet.getRange(range.getRow(), range.getColumn()+1).setValue("edited");
    }
  }
}

// J2 セルをクリアする関数
function clearJ2Cell() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("メール管理");
  sheet.getRange('J2').clearContent();
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    // clearJ2Cell という関数を呼び出すトリガーを探す
    if (triggers[i].getHandlerFunction() === 'clearJ2Cell') {
      // そのトリガーを削除
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}
