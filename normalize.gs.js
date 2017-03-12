var NEW_SHEET_NAME = "run05";
var MY_TARIFF_SHEET = 0;
var DEBUG = true;
var MY_INTEREST_RANGE = "A1:U755";
var CONCESSIONAIRE_LABEL_POSITION = 1;
var ROAD_LABEL_POSITION = 2;
var SQUARE_LABEL_POSITION = 1;

var SQUARE_LABEL = "Praça";
var ROAD_LABEL   = "Rodovia";

var globalHeaders = {};
globalHeaders["Concessionaria"] = 0;
globalHeaders["Rodovia"] = 1;
var idxCounters = 1;

function main() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tariffSheet = ss.getSheets()[MY_TARIFF_SHEET];
  var range = tariffSheet.getRange(MY_INTEREST_RANGE);
  var sheetData = range.getValues();
  
  var newData = [];
  var wasHeader = false;
  var tempHeaderGuide = {};
  var currentConcessionaire, currentRoad = null;
  
  
  for (row in sheetData) {
    var rowIdx = Number(row);    
    var tempNewRow = [];
    if (rowIdx === 0)
      var isConcessionaire = true;
    else
      var isConcessionaire = isConcessionaireRow(sheetData,rowIdx);
    var isRoadLabel      = isRoadLabelRow(sheetData[rowIdx]);
    var isHeader         = isHeaderRow(sheetData[rowIdx]);

    if ( isConcessionaire && currentConcessionaire !== sheetData[rowIdx][CONCESSIONAIRE_LABEL_POSITION] ) {
      currentConcessionaire = sheetData[rowIdx][CONCESSIONAIRE_LABEL_POSITION];
      continue;
    } else if ( isRoadLabel && currentRoad !== sheetData[rowIdx][ROAD_LABEL_POSITION] ) {
      currentRoad = sheetData[rowIdx][ROAD_LABEL_POSITION].split(":")[1];
      continue;
    } 
    
    if (isHeader) {
      tempHeaderGuide = {};
      for(col in sheetData[rowIdx])
      {
        Logger.log("**** " + col)
        var colValue = sheetData[rowIdx][col].toLowerCase().replace(/\s{2,}/g, ' ').replace(/motocicletas/g,'motocicleta');
        if (colValue !== "")
        {
          if (colValue.match(/(caminhão) - (ônibus) (.+)/)) {
            // hotfix to support caminhão and ônibus from same cell
            var myRegexp = /(caminhão) - (ônibus) (.+)/;
            var match = myRegexp.exec(colValue)
            var truckLabel = match[1] + " " + match[3]
            var busLabel = match[2] + " " + match[3]
            
            if ( typeof globalHeaders[truckLabel] === "undefined"  )
              globalHeaders[truckLabel] = ++idxCounters;
            
            if ( typeof globalHeaders[busLabel] === "undefined"  )
              globalHeaders[busLabel] = ++idxCounters;
            
            tempHeaderGuide[col] = globalHeaders[truckLabel];
          }
          else {
            // normal flow
            if ( typeof globalHeaders[colValue] === "undefined"  )
            {
              globalHeaders[colValue] = ++idxCounters;
            }
            tempHeaderGuide[col] = globalHeaders[colValue];
          }
        }
      }
    }
    else if ( !isRoadLabel && !isConcessionaire && sheetData[row][4] !== "" )
    {
      for(col in sheetData[rowIdx])
        tempNewRow[ tempHeaderGuide[col] ] = sheetData[rowIdx][col];

      tempNewRow[0] = currentConcessionaire;
      tempNewRow[1] = currentRoad;      
      newData.push(tempNewRow); 
    }
  }
  
  var headers = Object.keys(globalHeaders);
  
  createNewSheet(newData,headers);
  
}

function isConcessionaireRow(sheetData,rowIdx) {
  if ( typeof sheetData[rowIdx+1] !== "undefined" && typeof sheetData[rowIdx] !== "undefined" )
  { 
    if ( isRoadLabelRow(sheetData[rowIdx+1]) && sheetData[rowIdx][CONCESSIONAIRE_LABEL_POSITION] !== "" ) 
        return true;
  }
  
  return false;
}

function isHeaderRow(rowData) {
  if ( typeof rowData !== "undefined" && rowData[SQUARE_LABEL_POSITION] !== "" && rowData[SQUARE_LABEL_POSITION] === SQUARE_LABEL )
    return true;
  
  return false;
}

function isRoadLabelRow(rowData) {
  if ( typeof rowData !== "undefined" && rowData[ROAD_LABEL_POSITION] !== "" )
  {
    var road = rowData[ROAD_LABEL_POSITION].split(":")[0];
    if (road === ROAD_LABEL)
      return true;
  }
  return false;
}

function removeUnecessaryColumns(mSheet,positions) {
  for(var i = 0;i<positions.length;i++)
    mSheet.deleteColumn(positions[i]);
}

function createNewSheet( newData , headers ) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var newSheet = ss.insertSheet(NEW_SHEET_NAME,1);
  
  newSheet.appendRow(headers);
  
  for(row in newData)
    newSheet.appendRow(newData[row]);
}