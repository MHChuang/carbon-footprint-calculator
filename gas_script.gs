// ============================================================
// 旅遊碳足跡計算系統 — Google Apps Script 接收端
// ============================================================
// 用法：
// 1. 建立一個新的 Google Sheet，點選「擴充功能」>「Apps Script」
// 2. 將此程式碼貼上並存檔 (取代原有的 myFunction)
// 3. 點選右上角「部署」>「新增部署作業」
// 4. 類型選擇「網頁應用程式 (Web App)」
// 5. 執行身分選擇「我」，誰可以存取選擇「所有人 (Anyone)」
// 6. 點擊「部署」，授權後會得到一串「網頁應用程式網址 (URL)」
// 7. 將該 URL 貼到系統的 config.js 中的 gasEndpoint 變數。
// ============================================================

const SHT_NAME = '工作表1'; // 請確認您的工作表名稱是否為此

function doPost(e) {
  try {
    // 取得試算表與工作表
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHT_NAME);
    
    // 如果是第一次執行，建立表頭
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '時間紀錄', 
        '旅遊類型', 
        '天數', 
        '旅客人數', 
        '導遊人數', 
        '司機人數', 
        '總碳足跡(kgCO2e)', 
        '商家數量',
        '商家明細資料 (JSON)'
      ]);
      // 凍結第一列並設定粗體
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    }

    // 取得從前端傳來的資料 (使用 text/plain 的 postData)
    const jsonString = e.postData.contents;
    const data = JSON.parse(jsonString);

    // 準備寫入的列資料
    const rowData = [
      data.timestamp || new Date(),
      data.tripType || '',
      data.days || 1,
      data.passengers || 0,
      data.guides || 0,
      data.drivers || 0,
      data.totalCarbon || 0,
      data.merchantCount || 0,
      JSON.stringify(data.details || [])
    ];

    // 寫入資料
    sheet.appendRow(rowData);

    // 回傳成功訊息
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data saved' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // 發生錯誤時回傳錯誤訊息
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 供測試或避免 GET 請求錯誤使用
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'active', message: '碳足跡計算系統 API 運行中' }))
    .setMimeType(ContentService.MimeType.JSON);
}
