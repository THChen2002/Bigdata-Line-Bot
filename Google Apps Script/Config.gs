// 需在設定 => 指令碼屬性 設定以下參數
const scriptProperties = PropertiesService.getScriptProperties();

// 建立試算表menu
function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Line Messaging API")
    .addItem('更新使用者資訊', 'updateUserInfo')
    .addToUi();
}