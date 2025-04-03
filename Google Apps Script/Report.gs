//建立觸發條件
function createTrigger() {
  var allTriggers = ScriptApp.getProjectTriggers();

  var checkTemp = allTriggers.filter(function(item, index, array){
    return item.getHandlerFunction() == "getFormData";
  });
  if (checkTemp.length == 0) {
    ScriptApp.newTrigger("getFormData")
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onFormSubmit()
      .create();
  }
  alert("觸發條件已建立完成");
}