function countMatches(state=false) {
  Logger.log("countMatches" + " " + state);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var tournamentSheet = ss.getActiveSheet();
  var count = tournamentSheet.getRange(1,1,1,tournamentSheet.getLastColumn()).getValues()[0].filter(function(cell) {
    return typeof(cell) === "number";
  })[0];
  Logger.log(count);
  var data = tournamentSheet.getRange(1,1,tournamentSheet.getLastRow(),tournamentSheet.getLastColumn()).getValues();
  var date; // 申込開始日
  tournamentSheet.getRange(1,count+4,tournamentSheet.getLastRow(),2).getValues().forEach(function(row) {
    if(row[0] === "申込開始日")date = row[1];
    if(typeof(date) === "string" && row[0] === "リマインダー")date = row[1];
  });
  for (var i=0;i<data.length;i++) {
    if(data[i][2] !== "" && typeof(data[i][2]) === "string" && (data[i][2].includes(" ") || data[i][2].includes("　")) && ['A','B','C'].includes(data[i][4])) {
      var matchesList = fetchCountMatches(data[i][2],date);
      tournamentSheet.getRange(i+1,count+4,1,2).setValues([[matchesList.length,matchesList.join(", ")]]);
    }
    if(data[i][count+3] === "催促メール設定（「☆大会フォーム」から）"){
      tournamentSheet.getRange(i-1,count+4).setValue(Utilities.formatDate(date,"JST","yyyy年MM月dd日まで"));
    }
  }
}
function filterMatches(data, specifiedDate) {
  Logger.log("filterMatches");
  // 指定された日時の年度を計算
  var year = specifiedDate.getFullYear();
  var month = specifiedDate.getMonth() + 1; // getMonthは0が1月なので、+1して調整
  // 4月以前なら、年度は前年
  if (month < 4) {
    year -= 1;
  }
  
  // 年度の開始と終了を設定
  var fiscalYearStart = new Date(year, 3, 1); // 4月1日
  var fiscalYearEnd = new Date(year + 1, 2, 31); // 翌年の3月31日
  
  // 条件に一致するlocationをフィルタリング
  var locations = data.filter(function(item) {
    var date = new Date(item.date);
    var location = item.location;
    // 日付が年度内で、指定された文字列を含まないlocationのみを選択
    return date >= fiscalYearStart && date <= fiscalYearEnd && date < specifiedDate &&
           !location.includes('団体') && !location.includes('職域') && !location.includes('非公認');
  }).map(function(item) {
    return item.date + "：" + item.location; // 最終的なリストにはlocationのみを含める
  });
  
  return locations;
}

function uniqueMatches(matchesList) {
  Logger.log("uniqueMatches");
  var unique = {};
  matchesList.forEach(function(item) {
    var parts = item.split("：");
    var date = parts[0];
    var location = parts[1];
    // 同一の大会名に対して最初に見つかった日付のみを保持
    if (!unique[location]) {
      unique[location] = date;
    }
  });
  
  // uniqueオブジェクトから結合された文字列のリストを再構築
  var resultList = [];
  for (var location in unique) {
    resultList.push(unique[location] + "：" + location);
  }
  return resultList;
}

function registerDatabase(state=false,kounin=true) {
  Logger.log("registerDatabase" + " " + state);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var tournamentSheet = ss.getActiveSheet();
  var date;
  var tournamentName = tournamentSheet.getName();
  Logger.log(tournamentName);

  var count = tournamentSheet.getRange(1,1,1,tournamentSheet.getLastColumn()).getValues()[0].filter(function(cell) {
    return typeof(cell) === "number";
  })[0];
  Logger.log(count);
  var data = tournamentSheet.getRange(1,1,tournamentSheet.getLastRow(),count+3).getValues().filter(function(row) {
    return row[2] !== "" && typeof(row[2]) === "string" && (row[2].includes(" ") || row[2].includes("　")) && ['A','B','C'].includes(row[4]);
  });

  var list = [];
  data.forEach(function(row) {
    if(row[count+2] === "" || row[count+2] === "済" || (row[count+2].includes("繰") && row[count+2].includes("越")) || row[count+2] === "くりこし"){
      list.push(["〇",row[2],row[count+2]]);
    } else {
      list.push(["×",row[2],row[count+2]]);
    }
  });
  Logger.log(data);
  
  tournamentSheet.getRange(1,count+4,tournamentSheet.getLastRow(),2).getValues().forEach(function(row) {
    if(row[0] === "大会の日時") {
      date = row[1];
      if(typeof(date) === "string")date = row[1].replace("など","");
    }
  });
  
  if(state===false && ui.alert(
    '確認',
    `${Utilities.formatDate(date,"JST","yyyy年MM月dd日")}
    ${tournamentName}
    の抽選に通った人をデータベースに登録します。登録する人は以下
    ${list.join("\n")}`,
    ui.ButtonSet.YES_NO
  ) === ui.Button.NO)return;

  if(kounin === false || (state === false && ui.alert(
    '確認',
    `${tournamentName}は公認大会ですか？
（出場回数のカウントに関わります。）
かるた協会主催大会（全日本選手権や選抜大会など）は回数に計上されないため、非公認扱いとします。`,
    ui.ButtonSet.YES_NO
  )) === ui.Button.NO){
    tournamentName = tournamentName.replace(/([A-Z]+級)$/,'') + "（非公認）";
    kounin = false;
  } else {
    tournamentName = tournamentName.replace(/([A-Z]+級)$/,'');
  }
  
  for (var i=0;i<data.length;i++) {
    if(data[i][count+2] === "" || data[i][count+2] === "済") {
      connectDb(Utilities.formatDate(date,"JST","yyyy-MM-dd"),tournamentName,data[i][2]);
    }
  }
  var data2 = tournamentSheet.getDataRange().getValues();
  Logger.log(data2);
  for (var i=0;i<data2.length;i++) {
    if(data2[i][0] === "registerDatabase"){
      if(kounin){
        tournamentSheet.getRange(i+2,1).setValue("公認大会として登録済み");
      } else {
        tournamentSheet.getRange(i+2,1).setValue("非公認大会として登録済み");
      }
      return;
    }
  }
}

function connectDb(date,tournamentName,name) {
  Logger.log("connectDb " + date + tournamentName + name);
  var url = 'http://keiokarutakai.atwebpages.com/register_match.php';
  var payload = {
    'register-date': date,
    'register-location': tournamentName,
    'register-name': name
  };

  var options = {
    'method': 'post',
    'payload': payload
  };

  try {
    var response = UrlFetchApp.fetch(url,options);
    var text = response.getContentText();
    Logger.log(text);
  } catch (error) {
    Logger.log(error.toString());
  }
}

function fetchCountMatches(name,date) {
  Logger.log("fetchCountMatches" + name);
  var url = 'http://keiokarutakai.atwebpages.com/search_results2.php';
  var encodedName = encodeURIComponent(name.replace("　"," "));
  var encodedDate = encodeURIComponent(Utilities.formatDate(date,"JST","yyyy-MM-dd"));
  url = url + '?' + 'name=' + encodedName + '&' + 'date=' + encodedDate;
  Logger.log(url);

  // GETリクエストのオプションを設定
  var options = {
    'method' : 'get'
  };

  try {
    var response = UrlFetchApp.fetch(url,options);
    var text = response.getContentText();
    var data = JSON.parse(text);
    Logger.log(data);
    var strData = [];
    data.forEach(function(item) {
      strData.push([item.date,item.location].join(", "));
    });
    return strData;
  } catch(error) {
    Logger.log(error.toString());
  }
}

