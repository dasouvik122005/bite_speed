/**
 * College Canteen Google Sheets Web App Script
 * 
 * Instructions:
 * 1. Open a Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any code in Code.gs and paste this script.
 * 4. Click Save (disk icon).
 * 5. Click Deploy > New deployment.
 * 6. Select Type: Web app.
 * 7. Set Description: Canteen System Sync.
 * 8. Set Execute as: Me (your-email).
 * 9. Set Who has access: Anyone (Important: this allows the web client to sync).
 * 10. Click Deploy, authorize permissions, and copy the Web App URL.
 * 11. Paste this URL into the Admin Settings panel of the Canteen Web App.
 */

// Helper: Setup Sheets if they don't exist
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Menu Sheet
  var menuSheet = ss.getSheetByName("Menu");
  if (!menuSheet) {
    menuSheet = ss.insertSheet("Menu");
    var headers = ["id", "name", "price", "category", "inStock", "isVeg", "description"];
    menuSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Seed default menu items
    var defaultItems = [
      ["M1", "Veg Thali", 30, "Meals", true, true, "Steaming rice, yellow dal, seasonal mix veg sabji, aloo dam, fresh salad, and crispy papad."],
      ["M2", "Egg Thali", 40, "Meals", true, false, "Steaming rice, egg curry (2 boiled eggs), dal, seasonal bhaji, salad, and papad."],
      ["M3", "Chicken Thali", 65, "Meals", true, false, "Steaming rice, delicious home-style chicken curry (2 pcs), dal, seasonal bhaji, salad, and papad."],
      ["M4", "Fish Thali", 55, "Meals", true, false, "Steaming rice, traditional mustard fish curry (Rui/Katla 1 pc), dal, seasonal bhaji, salad, and papad."],
      ["M5", "Veg Fried Rice", 70, "Meals", true, true, "Flavorful stir-fried rice loaded with carrots, beans, sweet corn, and aromatic spices."],
      ["M6", "Aloo Dam", 40, "Meals", true, true, "Slow-cooked baby potatoes in a spicy, rich gravy with traditional Indian spices."],
      ["M7", "Chili Chicken", 90, "Snacks", true, false, "Tender chicken pieces tossed with bell peppers and onions in a spicy chili-soy sauce."],
      ["M8", "Vada Pav (Bada Pao)", 25, "Snacks", true, true, "Classic Mumbai style spicy potato dumpling in a soft butter-toasted pav bun with garlic chutney."],
      ["M9", "Pav Bhaji (Pao Vaji)", 50, "Snacks", true, true, "Mouth-watering thick mixed vegetable curry served with soft butter-toasted buns."],
      ["M10", "Veg Chop", 15, "Snacks", true, true, "Crispy beetroot-potato cutlet coated with golden breadcrumbs and fried to perfection."],
      ["M11", "Chicken Chop", 25, "Snacks", true, false, "Spiced minced chicken cutlet with a crunchy golden outer crust, served with mustard dip."],
      ["M12", "Sweet Doi (Yogurt)", 20, "Desserts", true, true, "Traditional sweet fermented yogurt chilled in a clay pot."],
      ["M13", "Sweet Lassi (Lossi)", 30, "Drinks", true, true, "Creamy, refreshing sweet yogurt blend whipped with cardamom and rose water."],
      ["M14", "Cold Drinks", 20, "Drinks", true, true, "Chilled carbonated soft drinks (Coca-Cola, Thums Up, Sprite) - 250ml."],
      ["M15", "Biscuit Pack", 10, "Snacks", true, true, "Fresh packets of popular biscuits (Marie Gold, Oreo, Good Day)."],
      ["M16", "Kurkure", 10, "Snacks", true, true, "Crispy, crunchy, masala munch snacks."]
    ];
    menuSheet.getRange(2, 1, defaultItems.length, headers.length).setValues(defaultItems);
    
    // Bold the headers
    menuSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    menuSheet.setFrozenRows(1);
  }
  
  // Setup Orders Sheet
  var ordersSheet = ss.getSheetByName("Orders");
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet("Orders");
    var headers = ["orderId", "rollNumber", "studentName", "items", "total", "timestamp"];
    ordersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    ordersSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    ordersSheet.setFrozenRows(1);
  }
  
  return { menuSheet: menuSheet, ordersSheet: ordersSheet };
}

// Handle GET Requests (Read Menu and Orders)
function doGet(e) {
  var action = e.parameter.action;
  setupSheets(); // Ensure tables exist
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === 'getMenu') {
      var sheet = ss.getSheetByName("Menu");
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var items = [];
      
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var item = {};
        for (var j = 0; j < headers.length; j++) {
          var val = row[j];
          // Convert inStock and isVeg to boolean if sheets treats them as strings/text
          if (headers[j] === "inStock" || headers[j] === "isVeg") {
            val = (val === true || String(val).toUpperCase() === "TRUE");
          }
          item[headers[j]] = val;
        }
        items.push(item);
      }
      return jsonResponse({ success: true, data: items });
    }
    
    if (action === 'getOrders') {
      var sheet = ss.getSheetByName("Orders");
      var data = sheet.getDataRange().getValues();
      var headers = ["orderId", "rollNumber", "studentName", "items", "total", "timestamp"];
      var orders = [];
      
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var order = {};
        for (var j = 0; j < headers.length; j++) {
          var val = row[j];
          if (headers[j] === "items") {
            try {
              val = JSON.parse(val);
            } catch (err) {
              val = []; // Fallback if parse fails
            }
          }
          order[headers[j]] = val;
        }
        orders.push(order);
      }
      // Return orders reversed so newest show up or as is
      return jsonResponse({ success: true, data: orders });
    }
    
    return jsonResponse({ success: false, message: "Invalid action. Use getMenu or getOrders." });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// Handle POST Requests (Create Order, Update Status, Toggle Stock)
function doPost(e) {
  setupSheets();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    
    if (action === 'createOrder') {
      var sheet = ss.getSheetByName("Orders");
      var newOrder = [
        postData.orderId,
        postData.rollNumber,
        postData.studentName || "",
        JSON.stringify(postData.items),
        postData.total,
        postData.timestamp || new Date().toISOString()
      ];
      sheet.appendRow(newOrder);
      return jsonResponse({ success: true, message: "Order placed successfully!" });
    }
    

    
    if (action === 'toggleStock') {
      var sheet = ss.getSheetByName("Menu");
      var data = sheet.getDataRange().getValues();
      var itemId = postData.id;
      var inStock = postData.inStock;
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === itemId) {
          // Column 5 is 'inStock' (0-indexed 4)
          sheet.getRange(i + 1, 5).setValue(inStock);
          return jsonResponse({ success: true, message: "Item stock toggled to " + inStock });
        }
      }
      return jsonResponse({ success: false, message: "Item ID not found: " + itemId });
    }
    
    if (action === 'updateMenu') {
      var sheet = ss.getSheetByName("Menu");
      // Clear data but keep headers
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
      }
      
      var items = postData.items;
      var rows = [];
      for (var i = 0; i < items.length; i++) {
        rows.push([
          items[i].id,
          items[i].name,
          items[i].price,
          items[i].category,
          items[i].inStock,
          items[i].isVeg,
          items[i].description
        ]);
      }
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 7).setValues(rows);
      }
      return jsonResponse({ success: true, message: "Menu updated successfully!" });
    }
    
    return jsonResponse({ success: false, message: "Invalid action." });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// Utility: Build output response with CORS-safe structures
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
