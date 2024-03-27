function createFormAndSheet(state=false) {
  Logger.log("createFormAndSheet " + "state:" + state);
  // アクティブなスプレッドシートを取得
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // "フォーム作成"という名前のシートを取得
  var sheet = ss.getSheetByName("フォーム作成");
  var calendarSheet = ss.getSheetByName("カレンダー");

  var adminRange = sheet.getRange('G10');

  var ui = SpreadsheetApp.getUi();
  
  // タイトルを取得（B2セル）
  var title = sheet.getRange("B2").getValue();
  var grades = sheet.getRange("C2").getValue();//級
  var questionsData = sheet.getRange("B5:D12").getValues();
  var moshikomiStart = sheet.getRange("A12").getValue(); // 申込開始日

  if(!(/[A-E]/.test(grades))) {
    if(state=false){
      ui.alert('注意','C2に半角アルファベットが含まれていません。',ui.ButtonSet.OK);
    } else {
      adminRange.setValue("C2に半角アルファベットが含まれていません。");
    }
    return;
  }
  if(state===false) {
    if (ui.alert(
      '確認',
      '「' + title + grades + '　参加表明フォーム」という名称のフォームを作成します。よろしければ「OK」を押してください。\n「いいえ」を押すと戻ります。',
      ui.ButtonSet.YES_NO
    ) == ui.Button.NO)return;
  }
  // 新しいGoogleフォームを作成
  var form = copyForm(title + grades + "　参加表明フォーム");
  var description = "こちらは" + title + grades + "の参加表明フォームです。\n該当項目に回答の上、送信してください。\n回答が正しく送信されている場合、入力いただいたメールアドレスに回答のコピーが届きますのでご確認ください。";
  form.setDescription(description);
  
  // フォームのIDを取得
  var formId = form.getId();
  var count = addQuestionsToForm(formId,questionsData,moshikomiStart);
  var formUrl = form.getPublishedUrl();
  var editUrl = form.getEditUrl();
  var formFile = DriveApp.getFileById(formId);
  formFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  
  formId = form.getId();
  // フォームの回答を既存のスプレッドシートにリンク
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  
  // 待機時間（シートが作成されるのを待つ）
  Utilities.sleep(2000);
  
  // スプレッドシートをリフレッシュ
  SpreadsheetApp.flush();
  
  // 最前面（最初）のシートを取得し、その名前を変更
  var sheets = ss.getSheets();
  var firstSheet = sheets[0];
  firstSheet.setName(title + grades);
  writeUniqueValueToSheet(title,grades,formUrl);


  firstSheet.getRange(1,count+6).setValue(count).setBackground("#D3D3D3");
  // D列からF列を非表示にする
  firstSheet.hideColumns(4, count - 2);  // 4はD列、3はDからFまでの列数
  
  // G1に"振込"と設定
  firstSheet.getRange(1,count+3,1,3).setValues([["振込み済みか",formId,editUrl]]);

  firstSheet.getRange(4,count+4,3,2).setValues([["催促メール設定（「☆大会フォーム」から）","↓送信予定日時（yyyy-MM-dd HH:mm:ss）"],["未設定",""],["後納制の場合は→に何か文字を",""]]).setBackground('#D3D3D3');
  firstSheet.getRange(2,count+6,5,1).setValues([["setPaymentReminders"],[""],["moveToDone"],[""],["deleteSheet"]]);
  firstSheet.hideColumns(count+6);
  firstSheet.getRange(5,count+5).setBackground("#FFF2CC");
  firstSheet.getRange(6,count+5).setBackground("#FFF2CC");
  firstSheet.getRange(1,count+3).setBackground("#FFF2CC");
  firstSheet.getRange(12,1,4,2).setValues([['registerDatabase','非公認の場合は下に文字'],['',''],['countMatches','申し込みのときに回数数える'],['','']]).setBackground("#d3d3d3");
  firstSheet.getRange(13,1,1,2).setBackground("#FFF2CC");
  firstSheet.getRange(15,1).setBackground("#FFF2CC");
  firstSheet.getRange(14,2,2,1).setBackground("#FFFFFF");


  //勘定する
  var grades2 = ['A', 'B', 'C', 'D', 'E'];
  for (var i=0; i<grades2.length; i++) {
    firstSheet.getRange(4 + i, 1).setValue(grades2[i]);
    var formula = '=COUNTIFS(E$1:E, "' + grades2[i] + '", INDIRECT("R1C" & (' + (count + 3) + ') & ":R" & ROWS(E:E) & "C" & (' + (count + 3) + '), FALSE), "済")';

    firstSheet.getRange(4 + i, 3).setFormula(formula);

    firstSheet.getRange(4+i,count+2).setFormula('=MULTIPLY(B' + (4 + i) + ',C' + (4 + i) + ')');
  }
  firstSheet.getRange(4,1,5,1).setHorizontalAlignment("right");
  var cd = title.includes('鳳玉') ? 3000 : 2000;
  var e = title.includes('鳳玉') ? 2500 : 1500;
  firstSheet.getRange('B4:B5').setValue(2500);
  firstSheet.getRange('B6:B7').setValue(cd);
  firstSheet.getRange('B8').setValue(e);
  firstSheet.getRange(9, 3).setFormula('=SUM($C4:$C8)');
  firstSheet.getRange(9, count + 2).setFormula('=SUMPRODUCT(B4:B8, C4:C8)');
  firstSheet.getRange(10,1,2,3).setValues([['原則として、振込が確認出来たら「済」と入れる。','',''],['何らかの理由ですでに振込がある分から回す場合は「繰り越し」と入れる。','','']])
                               .setBackground("#d3d3d3");
  // カレンダーへの書き込みは特に意味がないのでなくす。
  //var rowNum = findFromCalendar(calendarSheet,title+grades);
  //calendarSheet.getRange(rowNum,2).setValue("済");

  var announceEmailSheet = ss.getSheetByName("案内メール作成");
  announceEmailSheet.getRange(3,2,2,1).setValues([[title],[grades]]);
  announceEmailSheet.getRange(27,2).setValue(formUrl);
}

function highlightDuplicateNames() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getRange("C1:C" + sheet.getLastRow());
  var values = range.getValues(); // C列の値を二次元配列として取得
  values = values.filter(function(row) {
    return typeof(row[0]) === "string" && row[0] !== '';
  });
  Logger.log(values);
  var namesCount = {}; // 氏名をキーとしたカウント用のオブジェクト

  // 氏名のカウント
  for (var i = 0; i < values.length; i++) {
    var name = values[i][0].trim(); // 前後の空白を削除
    name = name.replace(/[ 　]+/g, " "); // 半角または全角の空白を単一の半角空白に統一
    if (namesCount[name]) {
      namesCount[name].push(i + 1); // 既にキーが存在する場合、行番号を追加
    } else {
      namesCount[name] = [i + 1]; // キーが存在しない場合、行番号の配列を新規作成
    }
  }

  // 同姓同名の行に色を塗る
  for (var name in namesCount) {
    if (namesCount[name].length > 1) { // 同姓同名が複数存在する場合
      for (var j = 0; j < namesCount[name].length; j++) {
        var row = namesCount[name][j];
        sheet.getRange("C" + row).setBackground("yellow"); // 色を塗る
      }
    }
  }
}

function memoForm(e) { // フォーム入力履歴一覧
  Logger.log("memoForm");
  var ss = SpreadsheetApp.openById("1KfxkE6RdW-u0AciuqGUMH9P1zeuOkBVa5Y6iTOzy6Hc");
  var formSheet = ss.getSheetByName("フォーム作成");
  formSheet.insertRows(25,1);
  formSheet.getRange(25,1,1,3).setValues([[e.values[2],e.range.getSheet().getName(),e.values[0]]]);
}

function findLastDataRow(sheet, column) {
  var data = sheet.getRange(column + "1:" + column).getValues(); // 例えばA列のデータを取得
  var lastDataRow = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] !== "") {
      lastDataRow = i;
    }
  }
  return lastDataRow + 1; // 配列のインデックスは0から始まるため+1
}

function findFromCalendar(calendarSheet, title) {
  Logger.log("カレンダーから" + title + "を探します。");
  var lastRow = findLastDataRow(calendarSheet, "A"); // A列をチェックする場合
  var calendarData = calendarSheet.getRange(2, 1, lastRow - 1, 3).getValues();
  var rowNum = 0;
  for (var i = 0; i < calendarData.length; i++) {
    if (title === calendarData[i][0]) {
      rowNum = i + 2;
      return rowNum;
    }
  }
  calendarSheet.getRange(lastRow + 1, 1).setValue(title);
  Logger.log(title + "を追加しました。");
  rowNum = lastRow + 1;
  return rowNum;
}


function copyForm(title) {
  var originalFormId = '1eDEcwPhpMJu3nDtqoa-zy1t4eQTQE7hzPQ0snL5XRtw'; // 元のフォームのIDを設定
  var originalForm = DriveApp.getFileById(originalFormId); // 元のフォームのファイルを取得
  var folder = DriveApp.getFolderById("1XWn30IjuzzpRzcWgPdQXd45AILDrObfZ");
  var newFormFile = originalForm.makeCopy(title, folder); // コピーを作成し、新しいタイトルを設定
  var newForm = FormApp.openById(newFormFile.getId());

  return newForm;
}

function writeUniqueValueToSheet(title,grades,formUrl) {//"メール管理"に書き込む用シート
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("メール管理"); // "メール管理"という名前のシートを取得
  
  // A~F列の6行目から最後までのデータを取得
  //var data = sheet.getRange("A6:F" + sheet.getLastRow()).getValues();
  // 最初の空白セルを探し、値を書き込む
  var lastRow = sheet.getLastRow();
  var firstEmptyRow = lastRow + 1; // 最後の行に続く行番号を取得
  sheet.getRange(firstEmptyRow,1,1,6).setValues([[title,grades,"","リマインダー",title + grades + "　案内",formUrl]]);
  sheet.getRange(2,3).setValue(firstEmptyRow);
}



function addQuestionsToForm(formId, questionsData,moshikomiStart) {
  // 既存のフォームをIDで取得
  var form = FormApp.openById(formId);
  var year = moshikomiStart.getFullYear();
  var month = moshikomiStart.getMonth();
  Logger.log(year+"年"+(month+1)+"月");
  var start = month+1 < 4 ? year-1 : year;
  var startDate = new Date();
  startDate.setFullYear(start);
  startDate.setMonth(3);
  startDate.setDate(1);
  startDate = Utilities.formatDate(startDate,"JST","yyyy年M月d日"); // 文字列
  var endDate = Utilities.formatDate(moshikomiStart,"JST","yyyy年M月d日"); // 文字列
  // メールアドレスの収集を有効にする
  form.setCollectEmail(true);
  var count = 0;
  
  var items = form.getItems();
  for (var i = 0; i < items.length; i++) {
    form.deleteItem(items[i]);
  }

  for (var i = 0; i < questionsData.length; i++) {
    var questionTitle = questionsData[i][0];
    var includeQuestion = questionsData[i][1];
    var isRequired = questionsData[i][2];
    var item;

    if (includeQuestion == 1) {  // 質問を含める場合
      count++;
      if (questionTitle.includes('氏名')) {
        item = form.addTextItem().setTitle(questionTitle);;
        var validation = FormApp.createTextValidation()
          .setHelpText("半角または全角スペースを含めてください。")
          .requireTextMatchesPattern(".*[ 　]+.*")
          .build();
        item.setValidation(validation);
      } else if (questionTitle === '級') {
        item = form.addMultipleChoiceItem().setTitle(questionTitle);;
        item.setChoiceValues(['A', 'B', 'C', 'D', 'E']);
      } else if (questionTitle === '段位') {
        item = form.addMultipleChoiceItem().setTitle(questionTitle);;
        item.setChoiceValues(['無段', '初段', '二段', '三段', '四段', '五段', '六段', '七段']);
      } else if (questionTitle.includes('公認大会出場回数')) {
        item = form.addTextItem().setTitle(
          year + "年度公認大会出場回数（" + startDate + "～" + endDate + "）"
        ).setHelpText('今年度の「申込開始日までに」出場した公認大会の回数をお書きください。\n回数や一覧はデータベースから確認することができます：http://keiokarutakai.atwebpages.com/database.php \n合言葉は「ゆずりん」です。\nまた、慶應かるた会botに「回数」と打っても確認できます。');
        item.setValidation(FormApp.createTextValidation()
          .setHelpText("半角数字を入力してください。分からない場合は適当に埋めてその他の欄にその旨を書いてください。")
          .requireNumber()
          .build());
      } else {
        item = form.addTextItem().setTitle(questionTitle);;
      }

      if (isRequired == 1) {  // 必須質問の場合
        item.setRequired(true);
      }
    }
  }
  return count;
}
