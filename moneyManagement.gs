function appendCashFlow(state=false) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cashFlowSheet = ss.getSheetByName('出納管理');
  var ui = SpreadsheetApp.getUi();
  var input = cashFlowSheet.getRange('A2:C2').getValues()[0];
  if(input[0] === "" || input[1] === "") {
    if(state === false) {
      ui.alert(
        '注意',
        '氏名と金額は入力してください。',
        ui.ButtonSet.OK
      );
    } else {
      cashFlowSheet.getRange('E8').setValue("氏名と金額は入力してください。");
    }
    return;
  }
  input[0] = input[0].replace("　"," ");
  var today = new Date();
  var lock = LockService.getScriptLock();
  if(lock.tryLock(5000)) {
    try{
      cashFlowSheet.insertRows(7);
      cashFlowSheet.getRange(7,1,1,4).setValues([[input[0],input[1],Utilities.formatDate(today,"JST","yyyy/MM/dd"),input[2]]]);
      lock.releaseLock();
    } catch(e) {
      Logger.log(e.message);
    }
  }
}

function recordTransactionEach(range) { // 済と入力された時
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cashFlowSheet = ss.getSheetByName("出納管理");
  var sheet = range.getSheet();
  var rowNum = range.getRow();
  var row = sheet.getRange(rowNum,1,1,sheet.getLastColumn()).getValues()[0];
  var tournamentName = sheet.getName();
  var count = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].filter(function(cell) {
    return typeof(cell) === "number";
  })[0];

  //if(row[count+5] === "記帳済" || row[count+5] === "記帳完了")return;
  var fees = {};
  var data = sheet.getDataRange().getValues();
  data.forEach(function(row) {
    if(row[0] === "A")fees["A"] = row[1];
    if(row[0] === "B")fees["B"] = row[1];
    if(row[0] === "C")fees["C"] = row[1];
    if(row[0] === "D")fees["D"] = row[1];
    if(row[0] === "E")fees["E"] = row[1];
  });
  var fee = fees[row[4]];
  var lock = LockService.getScriptLock();
  if(lock.tryLock(5000)) {
    try{
      Logger.log(row[2] + tournamentName + "　記帳");
      if(row[count+5] === "記帳済" || row[count+5] === "記帳完了")return;
      recordEachTransaction(cashFlowSheet,row[2].replace("　"," "),tournamentName,fee);
      sheet.getRange(rowNum,count+6).setValue("記帳済");
      lock.releaseLock();
    } catch(e) {
      Logger.log(e.message);
    }
  }
}

// 振り込んだ段階で行う。プラスマイナスゼロにする。
function recordTransactions(sheetName=""){ // 基本はカレンダーから呼び出される想定
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cashFlowSheet = ss.getSheetByName("出納管理");
  if(sheetName===""){
    var sheet = ss.getActiveSheet();
  } else {
    var sheet = ss.getSheetByName(sheetName);
  }
  var count = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].filter(function(cell) {
    return typeof(cell) === "number";
  })[0];
  var tournamentName = sheet.getName();
  var fees = {};
  var data = sheet.getDataRange().getValues();
  data.forEach(function(row) {
    if(row[0] === "A")fees["A"] = row[1];
    if(row[0] === "B")fees["B"] = row[1];
    if(row[0] === "C")fees["C"] = row[1];
    if(row[0] === "D")fees["D"] = row[1];
    if(row[0] === "E")fees["E"] = row[1];
  });
  for (var i=0;i<data.length;i++) {
    var sumi = data[i][count+2];
    if(sheetName !== ""){ // カレンダーから呼び出されている場合
      if(data[i][count+5] !== "記帳完了" && typeof(data[i][2]) === "string" && (data[i][2].includes(" ") || data[i][2].includes("　")) && (sumi === "済" || sumi === "繰り越し" || sumi === "繰越" || sumi === "繰越し" || sumi === "くりこし")) {
        var fee = fees[data[i][4]] * (-1);
        recordEachTransaction(cashFlowSheet,data[i][2].replace("　"," "),tournamentName,fee);
        sheet.getRange(i+1,count+6).setValue("記帳完了");
      }
    } else {
      if(data[i][count+5] !== "記帳完了" && data[i][count+5] !== "記帳済" && sumi === "済" && typeof(data[i][2]) === "string" && (data[i][2].includes(" ") || data[i][2].includes("　"))) {
        var fee = fees[data[i][4]];
        recordEachTransaction(cashFlowSheet,data[i][2].replace("　"," "),tournamentName,fee);
        sheet.getRange(i+1,count+6).setValue("記帳済");
      }
    }
  }
}

// カレンダーシートから呼び出される
function recordTransactionsFromCalendar(range) {
  var sheet = range.getSheet(); // カレンダー
  var rowNum = range.getRow();
  var row = sheet.getRange(rowNum,1,1,sheet.getLastColumn()).getValues()[0];
  recordTransactions(sheetName=row[0]);
}

// 残高記録シートに更新
function updateBalances(row="") {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 出納管理シートと残高記録シートを取得
  var cashFlowSheet = ss.getSheetByName('出納管理');
  var balancesSheet = ss.getSheetByName('残高記録');

  if(row !== "") {
    var balancesData = balancesSheet.getDataRange().getValues();
    Logger.log(balancesData);
    var count = balancesData.length;
    for(var i=0;i<balancesData.length;i++) {
      if(balancesData[i][0] === row[0]){
        balancesData[i][1] += row[1];
        break;
      }
      count--;
    }
    if(count === 0) {
      balancesData.push(row);
    }
    Logger.log(balancesData);
    balancesSheet.getRange(1,1,balancesData.length,2).setValues(balancesData);
    return;
  }

  sortCashFlowSheet(cashFlowSheet);
  
  // 出納管理シートからデータを取得（A7セルから開始）
  var transactionsRange = cashFlowSheet.getRange('A7:B' + cashFlowSheet.getLastRow());
  var transactions = transactionsRange.getValues(); 

  var data = [];

  // 残高記録シートにヘッダーを設定
  data.push(['氏名', '金額']);

  // 残高を計算して記録
  var balances = {};
  transactions.forEach(function(transaction) {
    var name = transaction[0].replace("　"," ");
    var amount = transaction[1];
    
    // 名前がキーとなるように金額を加算
    if (balances[name]) {
      balances[name] += amount;
    } else {
      balances[name] = amount;
    }
  });
  
  // 残高を残高記録シートに追加
  for (var name in balances) {
    data.push([name, balances[name]]);
  }
  balancesSheet.clear();
  balancesSheet.getRange(1,1,data.length,2).setValues(data);
}

// 1行ずつ追加する
function recordEachTransaction(cashFlowSheet,name, tournamentName, money) {
  var today = new Date();
  Logger.log("recordEachTransaction" + name + tournamentName);
  cashFlowSheet.insertRows(7);
  cashFlowSheet.getRange(7,1,1,4).setValues([[name,money,Utilities.formatDate(today,"JST","yyyy/MM/dd"),tournamentName + "　参加費"]]);
  updateBalances([name,money]);  
}

function sortCashFlowSheet(sheet) {
  var range = sheet.getDataRange(); // データが含まれる範囲を指定
  var filter = range.getFilter(); // 現在のフィルターを取得

  // フィルターが存在しない場合は作成する
  if (!filter) {
    filter = range.createFilter();
  }

  // フィルターを使って特定の列をソートする
  // ここでは、例として1列目（A列）を昇順にソートしています
  var sortSpec = {
    column: 3, // ソートする列の番号
    ascending: false // trueで昇順、falseで降順
  };
  filter.sort(sortSpec.column, sortSpec.ascending);
}

function maintainCashFlowSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cashFlowSheet = ss.getSheetByName("出納管理"); // シート名は適宜設定してください
  
  // Step 1: シートをソート（氏名でソート）
  updateBalances();
  
  // Step 2 & 3: 条件に一致する行を検出し、塗りつぶしまたは削除
  var dataRange = cashFlowSheet.getRange("A7:D" + cashFlowSheet.getLastRow());
  var data = dataRange.getValues();
  var today = new Date();
  var threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  
  var toDelete = []; // 削除する行のインデックスを格納
  
  // 事由と金額に基づいて処理
  var grouped = {};
  data.forEach(function(row, index) {
    var name = row[0]; // 氏名
    var reason = row[3]; // 事由
    var key = name + ":" + reason; // 氏名と事由の組み合わせをキーとする
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push({index: index, data: row});
  });
  
  // キーごとに処理
  Object.keys(grouped).forEach(function(key) {
    var transactions = grouped[key];
    var sum = transactions.reduce(function(acc, obj) { return acc + obj.data[1]; }, 0); // 金額の合計
    
    if (sum === 0) {
      transactions.forEach(function(obj) {
        var lastUpdate = new Date(obj.data[2]);
        if (lastUpdate <= threeMonthsAgo) {
          // 削除対象
          toDelete.push(obj.index + 7); // 実際の行番号に変換
        } else {
          // グレーに塗る
          cashFlowSheet.getRange("A" + (obj.index + 7) + ":D" + (obj.index + 7)).setBackground("#d3d3d3");
        }
      });
    }
  });
  
  // 行を削除（後ろから削除していく）
  toDelete.sort(function(a, b) { return b - a; }).forEach(function(rowIndex) {
    cashFlowSheet.deleteRow(rowIndex);
  });
}
