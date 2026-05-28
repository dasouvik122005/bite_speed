/**
 * BiteSpeed Canteen Management App Logic
 * Client-Side Student Dashboard & Ordering Kiosk
 * 
 * NOTE: The Admin Dashboard has been removed. All administrative actions
 * (updating menus, marking orders as Preparing/Ready, toggling stock) 
 * are managed directly inside your linked Google Sheet!
 */

// Paste your Google Apps Script Web App URL here to link with Google Sheets!
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwtMBos8SbzXW263UkjapNB-ooRPMKQtkYctcH6x3lO_QBgy2yuz78tAlfugJTHR8nH/exec";

// Default Seed Menu Database (used if Google Sheet is not yet connected or offline)
const DEFAULT_MENU = [
  { id: "M1", name: "Veg Thali", price: 30, category: "Meals", inStock: true, isVeg: true, description: "Steaming rice, yellow dal, seasonal mix veg sabji, aloo dam, fresh salad, and crispy papad." },
  { id: "M2", name: "Egg Thali", price: 40, category: "Meals", inStock: true, isVeg: false, description: "Steaming rice, egg curry (2 boiled eggs), dal, seasonal bhaji, salad, and papad." },
  { id: "M3", name: "Chicken Thali", price: 65, category: "Meals", inStock: true, isVeg: false, description: "Steaming rice, delicious home-style chicken curry (2 pcs), dal, seasonal bhaji, salad, and papad." },
  { id: "M4", name: "Fish Thali", price: 55, category: "Meals", inStock: true, isVeg: false, description: "Steaming rice, traditional mustard fish curry (Rui/Katla 1 pc), dal, seasonal bhaji, salad, and papad." },
  { id: "M5", name: "Veg Fried Rice", price: 70, category: "Meals", inStock: true, isVeg: true, description: "Flavorful stir-fried rice loaded with carrots, beans, sweet corn, and aromatic spices." },
  { id: "M6", name: "Aloo Dam", price: 40, category: "Meals", inStock: true, isVeg: true, description: "Slow-cooked baby potatoes in a spicy, rich gravy with traditional Indian spices." },
  { id: "M7", name: "Chili Chicken", price: 90, category: "Snacks", inStock: true, isVeg: false, description: "Tender chicken pieces tossed with bell peppers and onions in a spicy chili-soy sauce." },
  { id: "M8", name: "Vada Pav (Bada Pao)", price: 25, category: "Snacks", inStock: true, isVeg: true, description: "Classic Mumbai style spicy potato dumpling in a soft butter-toasted pav bun with garlic chutney." },
  { id: "M9", name: "Pav Bhaji (Pao Vaji)", price: 50, category: "Snacks", inStock: true, isVeg: true, description: "Mouth-watering thick mixed vegetable curry served with soft butter-toasted buns." },
  { id: "M10", name: "Veg Chop", price: 15, category: "Snacks", inStock: true, isVeg: true, description: "Crispy beetroot-potato cutlet coated with golden breadcrumbs and fried to perfection." },
  { id: "M11", name: "Chicken Chop", price: 25, category: "Snacks", inStock: true, isVeg: false, description: "Spiced minced chicken cutlet with a crunchy golden outer crust, served with mustard dip." },
  { id: "M12", name: "Sweet Doi (Yogurt)", price: 20, category: "Desserts", inStock: true, isVeg: true, description: "Traditional sweet fermented yogurt chilled in a clay pot." },
  { id: "M13", name: "Sweet Lassi (Lossi)", price: 30, category: "Drinks", inStock: true, isVeg: true, description: "Creamy, refreshing sweet yogurt blend whipped with cardamom and rose water." },
  { id: "M14", name: "Cold Drinks", price: 20, category: "Drinks", inStock: true, isVeg: true, description: "Chilled carbonated soft drinks (Coca-Cola, Thums Up, Sprite) - 250ml." },
  { id: "M15", name: "Biscuit Pack", price: 10, category: "Snacks", inStock: true, isVeg: true, description: "Fresh packets of popular biscuits (Marie Gold, Oreo, Good Day)." },
  { id: "M16", name: "Kurkure", price: 10, category: "Snacks", inStock: true, isVeg: true, description: "Crispy, crunchy, masala munch snacks." }
];

// App State Core
let state = {
  menu: [],
  cart: [],
  orders: [],
  currentCategory: "all"
};

// Initialize Application
function init() {
  loadData();
  setupEventListeners();
  renderMenu();
  renderCart();
  
  // Set up background polling if Google Sheet URL is defined
  if (GOOGLE_SCRIPT_URL) {
    syncFromGoogleSheets();
    // Poll every 5 seconds for live device-to-device updates from the Google Sheet
    setInterval(syncFromGoogleSheets, 5000);
  }
}

// Load configurations and datasets from LocalStorage
function loadData() {
  // 1. Menu load
  const cachedMenu = localStorage.getItem("canteen_menu");
  if (cachedMenu) {
    try {
      state.menu = JSON.parse(cachedMenu);
    } catch (e) {
      state.menu = [...DEFAULT_MENU];
    }
  } else {
    state.menu = [...DEFAULT_MENU];
    saveToStorage("canteen_menu", state.menu);
  }

  // 2. Orders load
  const cachedOrders = localStorage.getItem("canteen_orders");
  if (cachedOrders) {
    try {
      state.orders = JSON.parse(cachedOrders);
    } catch (e) {
      state.orders = [];
    }
  } else {
    state.orders = [];
  }

  // 3. Cart load
  const cachedCart = localStorage.getItem("canteen_cart");
  if (cachedCart) {
    try {
      state.cart = JSON.parse(cachedCart);
    } catch (e) {
      state.cart = [];
    }
  } else {
    state.cart = [];
  }
}

// Helper: Save items to localStorage
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ================= RENDER ENGINES =================

// Render student menu with filters
function renderMenu() {
  const menuGrid = document.getElementById("menu-grid");
  const searchQuery = document.getElementById("menu-search").value.toLowerCase();
  const vegOnly = document.getElementById("veg-only-filter").checked;
  
  menuGrid.innerHTML = "";
  
  const filtered = state.menu.filter(item => {
    // Category Filter
    if (state.currentCategory !== "all" && item.category !== state.currentCategory) {
      return false;
    }
    // Search Query Filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery) && !item.description.toLowerCase().includes(searchQuery)) {
      return false;
    }
    // Veg Filter
    if (vegOnly && !item.isVeg) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    menuGrid.innerHTML = `
      <div class="empty-queue-placeholder" style="grid-column: 1 / -1;">
        <h4>No Items Found</h4>
        <p>Try searching for something else or change the category filter.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    // Treat string "TRUE"/"FALSE" from sheet correctly
    const isInStock = (item.inStock === true || String(item.inStock).toUpperCase() === "TRUE");
    const isVegItem = (item.isVeg === true || String(item.isVeg).toUpperCase() === "TRUE");

    const card = document.createElement("div");
    card.className = `menu-card ${isInStock ? "" : "out-of-stock"}`;
    
    const dietBadge = isVegItem 
      ? `<span class="veg-badge"><span class="dot-indicator"></span>Veg</span>`
      : `<span class="nonveg-badge"><span class="dot-indicator"></span>Non-Veg</span>`;
      
    // Professional Card-Level Quantity Selector Check
    const cartItem = state.cart.find(c => c.id === item.id);
    let actionBtn = "";
    
    if (!isInStock) {
      actionBtn = `<button class="btn btn-outofstock" disabled>Out of Stock</button>`;
    } else if (cartItem) {
      actionBtn = `
        <div class="card-qty-selector">
          <button class="card-qty-btn" onclick="updateCartQty('${item.id}', -1)">&minus;</button>
          <span class="card-qty-val">${cartItem.qty}</span>
          <button class="card-qty-btn" onclick="updateCartQty('${item.id}', 1)">&plus;</button>
        </div>
      `;
    } else {
      actionBtn = `<button class="btn btn-add-cart" onclick="addToCart('${item.id}')">Add to Basket</button>`;
    }

    card.innerHTML = `
      <div class="menu-item-info">
        <div class="menu-item-meta">
          ${dietBadge}
          <span class="price-tag">₹${item.price}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="menu-item-action">
          ${actionBtn}
        </div>
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

// Render shopping cart
function renderCart() {
  const cartList = document.getElementById("cart-items-list");
  const cartFooter = document.getElementById("cart-footer");
  const cartBadgeCount = document.getElementById("cart-badge-count");
  const floatingBadgeCount = document.getElementById("floating-badge-count");
  
  // Calculate total items
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadgeCount.textContent = totalCount;
  floatingBadgeCount.textContent = totalCount;

  if (state.cart.length === 0) {
    cartList.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-icon">🛒</div>
        <h4>Your basket is empty</h4>
        <p>Go back and add some delicious snacks to satisfy your hunger cravings!</p>
      </div>
    `;
    cartFooter.style.display = "none";
    return;
  }

  cartList.innerHTML = "";
  cartFooter.style.display = "block";
  
  let subtotal = 0;

  state.cart.forEach(cartItem => {
    const menuItem = state.menu.find(m => m.id === cartItem.id);
    if (!menuItem) return;
    
    const itemCost = menuItem.price * cartItem.qty;
    subtotal += itemCost;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-item-details">
        <h4>${menuItem.name}</h4>
        <span>₹${menuItem.price} &times; ${cartItem.qty}</span>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="updateCartQty('${cartItem.id}', -1)">&minus;</button>
        <span class="qty-count">${cartItem.qty}</span>
        <button class="qty-btn" onclick="updateCartQty('${cartItem.id}', 1)">&plus;</button>
      </div>
    `;
    cartList.appendChild(div);
  });

  const tax = Math.round(subtotal * 0.05); // 5% CGST + SGST
  const total = subtotal + tax;

  document.getElementById("bill-subtotal").textContent = `₹${subtotal}`;
  document.getElementById("bill-tax").textContent = `₹${tax}`;
  document.getElementById("bill-total").textContent = `₹${total}`;
}

// ================= CART AND ORDER ACTIONS =================

// Add Item to cart
window.addToCart = function(id) {
  const item = state.menu.find(m => m.id === id);
  if (!item) return;
  const isInStock = (item.inStock === true || String(item.inStock).toUpperCase() === "TRUE");
  if (!isInStock) return;

  const existing = state.cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id: id, qty: 1 });
  }

  saveToStorage("canteen_cart", state.cart);
  renderCart();
  renderMenu(); // Re-render menu cards to display quantity selector
  showToast(`Added ${item.name} to basket`, "success");
  
  // Animate floating cart button
  const cartBtn = document.getElementById("btn-floating-cart");
  cartBtn.classList.add("pulse-anim");
  setTimeout(() => cartBtn.classList.remove("pulse-anim"), 500);
};

// Update cart item quantity
window.updateCartQty = function(id, delta) {
  const index = state.cart.findIndex(c => c.id === id);
  if (index === -1) return;

  state.cart[index].qty += delta;

  if (state.cart[index].qty <= 0) {
    const item = state.menu.find(m => m.id === id);
    state.cart.splice(index, 1);
    showToast(`Removed ${item ? item.name : 'item'} from basket`, "info");
  }

  saveToStorage("canteen_cart", state.cart);
  renderCart();
  renderMenu(); // Re-render menu cards to sync quantity updates
};

// Place Order checkout
function placeOrder() {
  if (state.cart.length === 0) return;

  const nameInput = document.getElementById("checkout-student-name");
  const studentName = nameInput.value.trim();
  const nameError = document.getElementById("name-error");

  const rollInput = document.getElementById("checkout-roll-number");
  const rollNumber = rollInput.value.trim().toUpperCase();
  const errorMsg = document.getElementById("roll-error");

  // Validate Name (At least 2 characters)
  if (!studentName || studentName.length < 2) {
    nameError.style.display = "block";
    nameInput.focus();
    return;
  }
  nameError.style.display = "none";

  // Validate Roll number (At least 4 alphanumeric chars)
  const rollRegex = /^[A-Z0-9]{4,12}$/i;
  if (!rollNumber || !rollRegex.test(rollNumber)) {
    errorMsg.style.display = "block";
    rollInput.focus();
    return;
  }
  errorMsg.style.display = "none";

  // Compile cart details
  let orderItems = [];
  let subtotal = 0;
  
  state.cart.forEach(cartItem => {
    const menuItem = state.menu.find(m => m.id === cartItem.id);
    if (menuItem) {
      orderItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty: cartItem.qty
      });
      subtotal += menuItem.price * cartItem.qty;
    }
  });

  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  // Generate unique numeric token ID (4-digit format)
  let lastId = 1000;
  if (state.orders.length > 0) {
    // Extract highest numeric ID safely
    const ids = state.orders.map(o => {
      if (!o.orderId || typeof o.orderId !== 'string') return 1000;
      const parts = o.orderId.split("-");
      return parts.length > 1 ? parseInt(parts[1]) : 1000;
    });
    lastId = Math.max(...ids, 1000);
  }
  const nextIdNum = lastId + 1;
  const orderId = `TKN-${nextIdNum}`;

  const newOrder = {
    orderId: orderId,
    rollNumber: rollNumber,
    studentName: studentName,
    items: orderItems,
    total: total,
    timestamp: new Date().toISOString()
  };

  // Add order locally
  state.orders.unshift(newOrder);
  saveToStorage("canteen_orders", state.orders);

  // Send to Google Sheets if enabled
  if (GOOGLE_SCRIPT_URL) {
    postToGoogleSheets({
      action: "createOrder",
      ...newOrder
    });
  }

  // Clear Cart
  state.cart = [];
  saveToStorage("canteen_cart", state.cart);
  renderCart();
  renderMenu(); // Re-render menu cards to revert selectors to "Add to Basket" buttons

  // Reset name and roll number inputs
  nameInput.value = "";
  rollInput.value = "";
  
  // Close cart drawer
  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("drawer-backdrop").classList.remove("active");

  showToast(`Order Placed! Token ID: ${orderId}`, "success");
  
  // Play order confirmation synth note chime
  playTone(523.25, "sine", 0.15); // C5
  setTimeout(() => playTone(659.25, "sine", 0.25), 150); // E5

  // Display Token Receipt modal details
  openTokenReceipt(orderId);
}

// Display Specific Order Token Modal
window.openTokenReceipt = function(orderId) {
  const order = state.orders.find(o => o.orderId === orderId);
  if (!order) return;

  const container = document.getElementById("token-receipt-container");
  
  // Construct Items row markup
  let itemsHtml = "";
  order.items.forEach(item => {
    itemsHtml += `
      <div class="receipt-item-row">
        <span class="receipt-item-name">${item.name} &times; ${item.qty}</span>
        <span class="receipt-item-price">₹${item.price * item.qty}</span>
      </div>
    `;
  });

  // Calculate taxes and details
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = order.total - subtotal;
  const dateFormatted = new Date(order.timestamp).toLocaleString();

  // Create random-like barcode representation lines
  const barcodeValue = (order.orderId || "").replace("-", "") + (order.rollNumber || "STUD").substring(0, 4);
  let barcodeLines = "";
  for (let i = 0; i < 24; i++) {
    const width = (i % 3 === 0) ? "3px" : (i % 5 === 0) ? "4px" : "1px";
    const margin = (i % 4 === 0) ? "3px" : "2px";
    barcodeLines += `<span style="width: ${width}; margin-right: ${margin};"></span>`;
  }

  container.innerHTML = `
    <div id="receipt-print-area" style="background: #ffffff; padding-bottom: 20px;">
      <div class="receipt-header">
      <h3>BiteSpeed Campus Diner</h3>
      <p>Official Order Ticket</p>
    </div>
    <div class="receipt-body">
      <div class="receipt-token-val">
        <span>Order Token</span>
        <h2>${order.orderId}</h2>
      </div>

      <div class="receipt-meta-info">
        <div class="receipt-meta-row">
          <span>Customer Name:</span>
          <strong>${order.studentName || 'Guest'}</strong>
        </div>
        <div class="receipt-meta-row">
          <span>Roll Number:</span>
          <strong>${order.rollNumber}</strong>
        </div>
        <div class="receipt-meta-row">
          <span>Date/Time:</span>
          <span>${dateFormatted}</span>
        </div>
        <div class="receipt-meta-row">
          <span>Payment:</span>
          <span style="color:#10b981; font-weight:600;">Counter Payment</span>
        </div>
      </div>

      <div class="receipt-items-list">
        ${itemsHtml}
      </div>

      <div class="receipt-total-row">
        <span>Subtotal</span>
        <span>₹${subtotal}</span>
      </div>
      <div class="receipt-total-row">
        <span>CGST+SGST (5%)</span>
        <span>₹${tax}</span>
      </div>
      <div class="receipt-total-row">
        <span>Total Bill</span>
        <h4>₹${order.total}</h4>
      </div>

      <!-- Barcode visualization -->
      <div class="receipt-barcode">
        <div class="barcode-lines">
          ${barcodeLines}
        </div>
        <span class="barcode-val">${barcodeValue}</span>
      </div>
      </div>
    </div>
    <div class="receipt-actions" style="margin-top: 15px;">
      <button class="btn btn-primary" onclick="downloadTokenPNG('${order.orderId}')" style="margin-bottom:10px; width:100%;">Download Token (PNG)</button>
      <button class="btn btn-secondary" onclick="closeTokenReceipt()" style="width:100%;">Close Receipt</button>
    </div>
  `;

  document.getElementById("token-detail-modal").classList.add("open");
};

window.closeTokenReceipt = function() {
  document.getElementById("token-detail-modal").classList.remove("open");
};

// Download Token as PNG Image
window.downloadTokenPNG = function(orderId) {
  if (typeof html2canvas === 'undefined') {
    showToast("Download utility is still loading, please try again.", "warning");
    return;
  }
  
  const printArea = document.getElementById("receipt-print-area");
  
  // Temporarily force styles for accurate render
  printArea.style.borderRadius = "20px";
  
  html2canvas(printArea, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true
  }).then(canvas => {
    // Revert inline styles
    printArea.style.borderRadius = "";
    
    // Create download link
    const link = document.createElement("a");
    link.download = `BiteSpeed-Token-${orderId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("Token downloaded successfully!", "success");
  }).catch(err => {
    console.error("Failed to generate token PNG:", err);
    showToast("Failed to save token image.", "error");
  });
};

// ================= GOOGLE SHEETS SYNC CLIENT =================

// Sync data FROM Google Sheets (GET orders & menu)
async function syncFromGoogleSheets() {
  const url = GOOGLE_SCRIPT_URL;
  if (!url) return;

  try {
    // 1. Fetch live orders from spreadsheet
    const resOrders = await fetch(`${url}?action=getOrders`);
    const ordersResult = await resOrders.json();
    
    if (ordersResult.success && ordersResult.data) {
      let ordersChanged = false;
      const sheetOrders = ordersResult.data;
      
      // Merge sheet orders with local orders
      sheetOrders.forEach(sheetOrder => {
        const localIdx = state.orders.findIndex(o => o.orderId === sheetOrder.orderId);
        if (localIdx === -1) {
          // Append new orders placed on other sessions
          state.orders.push(sheetOrder);
          ordersChanged = true;
        }
      });

      if (ordersChanged) {
        // Sort orders newest first
        state.orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        saveToStorage("canteen_orders", state.orders);

        // Refresh open token receipt modal if currently open
        const tokenModal = document.getElementById("token-detail-modal");
        if (tokenModal && tokenModal.classList.contains("open")) {
          const currentReceiptIdElement = tokenModal.querySelector("h2");
          if (currentReceiptIdElement) {
            const currentReceiptId = currentReceiptIdElement.textContent;
            openTokenReceipt(currentReceiptId);
          }
        }

        // Refresh My Tokens list if currently open
        const tokensModal = document.getElementById("my-tokens-modal");
        if (tokensModal && tokensModal.classList.contains("open")) {
          const lookupInput = document.getElementById("token-lookup-roll");
          if (lookupInput && lookupInput.value.trim()) {
            lookupTokens(); // Refresh list
          }
        }
      }
    }

    // 2. Fetch Menu details (allows admin to update menu stock, items, prices directly in sheets)
    const resMenu = await fetch(`${url}?action=getMenu`);
    const menuResult = await resMenu.json();
    
    if (menuResult.success && menuResult.data && Array.isArray(menuResult.data)) {
      // Overwrite local menu with sheet data to sync additions, deletions, edits, and stock status shifts
      state.menu = menuResult.data;
      saveToStorage("canteen_menu", state.menu);
      renderMenu();
    }

  } catch (error) {
    console.error("Google Sheets Sync Failure:", error);
  }
}

// POST data to Google Sheets
async function postToGoogleSheets(payload) {
  const url = GOOGLE_SCRIPT_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors", // Bypasses preflight restrictions for serverless script redirects
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Cloud Post Error:", err);
  }
}

// ================= UTILITIES & HELPERS =================

// Toast System
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icon = type === "success" ? "✓" : type === "warning" ? "⚠️" : type === "error" ? "❌" : "ℹ️";
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Auto remove toast
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 4000);
}

// Sound Warning synthesizer
function playTone(freq, type = "sine", duration = 0.2) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime); // Low volume
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    // Browser blocked audio context or audio unsupported
  }
}

function triggerOrderReadyAlarm(orderId) {
  // Nice chime ring (A5 -> C6 -> E6) to alert student their order is ready!
  playTone(880, "triangle", 0.15);
  setTimeout(() => playTone(1046.5, "triangle", 0.15), 120);
  setTimeout(() => playTone(1318.5, "triangle", 0.35), 240);
  showToast(`🔔 Token ${orderId} is Ready for pickup!`, "success");
}

// Handle Navigation clicks and lookup submit
function setupEventListeners() {
  // Search input filtering
  document.getElementById("menu-search").addEventListener("input", renderMenu);
  document.getElementById("veg-only-filter").addEventListener("change", renderMenu);

  // Category Pills
  const catPills = document.querySelectorAll("#category-tabs .category-tab");
  catPills.forEach(pill => {
    pill.addEventListener("click", () => {
      catPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.currentCategory = pill.getAttribute("data-category");
      renderMenu();
    });
  });

  // Cart Side Drawer show/close
  document.getElementById("btn-close-cart").addEventListener("click", toggleCartDrawer);
  document.getElementById("btn-floating-cart").addEventListener("click", toggleCartDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click", toggleCartDrawer);

  // Roll Number place order validation submit
  document.getElementById("btn-place-order").addEventListener("click", placeOrder);

  // Active student tokens lookup modals
  document.getElementById("btn-my-tokens").addEventListener("click", () => {
    document.getElementById("my-tokens-modal").classList.add("open");
  });
  document.getElementById("btn-close-tokens").addEventListener("click", () => {
    document.getElementById("my-tokens-modal").classList.remove("open");
  });
  document.getElementById("btn-lookup-submit").addEventListener("click", lookupTokens);
}

// Toggle Cart Sidebar Drawer
function toggleCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  
  if (drawer.classList.contains("open")) {
    drawer.classList.remove("open");
    backdrop.classList.remove("active");
  } else {
    drawer.classList.add("open");
    backdrop.classList.add("active");
  }
}

// Lookup Student Tokens by Roll Number
async function lookupTokens() {
  const roll = document.getElementById("token-lookup-roll").value.trim().toUpperCase();
  const list = document.getElementById("my-tokens-list");

  if (!roll) {
    showToast("Please enter a roll number to query tokens.", "error");
    return;
  }

  // Show loading state
  list.innerHTML = `
    <div class="no-tokens-placeholder">
      <p>⏳ Syncing data</p>
    </div>
  `;

  // Fetch live updates from the Google Sheet first
  if (GOOGLE_SCRIPT_URL) {
    await syncFromGoogleSheets();
  }

  // Filter local orders matching roll number
  const studentOrders = state.orders.filter(o => String(o.rollNumber).toUpperCase() === roll);

  if (studentOrders.length === 0) {
    list.innerHTML = `
      <div class="no-tokens-placeholder">
        <p>No order tokens found for roll number <strong>${roll}</strong>.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = "";
  studentOrders.forEach(order => {
    const itemSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(", ");
    
    const div = document.createElement("div");
    div.className = "token-card-pills";
    div.onclick = () => {
      document.getElementById("my-tokens-modal").classList.remove("open");
      openTokenReceipt(order.orderId);
    };

    const dateFormatted = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
      <div class="token-pills-left">
        <h4>Token ID: ${order.orderId}</h4>
        <span style="display:block; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${itemSummary}</span>
        <span>${dateFormatted} &bull; Total Bill: ₹${order.total}</span>
      </div>
    `;
    list.appendChild(div);
  });
}

// Run Initializer on script execution
window.onload = init;
