# College Canteen Management System

A lightweight, fully responsive, client-side web application designed to streamline ordering and token generation at a college canteen. The application runs entirely in the browser and seamlessly synchronizes with a Google Sheet, which acts as the backend database and administration panel.

## Features

- **Modern Student Kiosk**: A stunning, premium glassmorphism dark-theme user interface built for mobile and desktop.
- **Dynamic Menu**: Real-time menu rendering grouped by categories (Meals, Snacks, Drinks, Desserts). Includes a vegetarian-only filter and a live search bar.
- **Smart Cart & Checkout**: Easily add items, adjust quantities with Zomato-style selectors `[ - ] 1 [ + ]`, and calculate total bills (with 5% tax support if needed).
- **Token Generation**: Collects the student's Name and Roll Number at checkout and generates a digital token receipt.
- **My Tokens Ledger**: Students can look up their past tokens using their Roll Number.
- **Serverless Backend (Google Sheets)**: All data is instantly saved to a linked Google Sheet via Google Apps Script. 

## Architecture & How It Works

This project completely decouples the frontend client from the admin manager. 
- **Frontend**: Standard HTML, CSS, and vanilla JS. It relies on `localStorage` for offline persistence and session state.
- **Backend/Admin**: A connected Google Sheet acts as the database. 
  - The `Menu` tab in the Google Sheet is polled by the frontend. If the canteen manager changes a price, adds a new item, or flips the `inStock` column to `FALSE`, the student kiosk updates automatically without needing any code changes.
  - The `Orders` tab acts as a live ledger, logging every order's Token ID, Student Name, Roll Number, Items ordered, and Total Bill.

*(Note: Order status tracking (e.g., Pending, Ready) has been removed to simplify operations. The digital token acts purely as a proof of order for counter pickup).*

## Files Overview

1. `index.html` - The structural markup for the student kiosk, modals, and cart drawer.
2. `styles.css` - Custom CSS containing the design system, animations, responsive breakpoints, and UI styling.
3. `app.js` - The core application logic. Handles cart state, local storage, UI rendering, and API fetch calls to Google Sheets.
4. `google-apps-script.js` - The backend serverless script. This code must be pasted into the Google Apps Script editor attached to your Google Sheet.

## Installation & Deployment

### 1. Setup the Backend (Google Sheets)
1. Create a new Google Sheet.
2. Click **Extensions > Apps Script**.
3. Delete any default code in `Code.gs` and paste the contents of `google-apps-script.js` into it.
4. Click **Deploy > New Deployment**.
5. Select type **Web app**.
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` (Important for the frontend to be able to talk to it).
6. Click Deploy, authorize the permissions, and copy the **Web app URL**.

### 2. Connect the Frontend
1. Open the `app.js` file in your code editor.
2. Locate the `GOOGLE_SCRIPT_URL` variable at the top of the file (around line 11).
3. Paste your new Web app URL into the quotes.
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_URL_HERE/exec";
   ```
4. Save the file.

### 3. Run the App
- Simply double-click `index.html` to open it in your browser.
- The first time it connects to your Google Sheet, it will automatically generate the `Menu` and `Orders` tabs and populate the menu with a default seed list of items (Veg Thali, Chicken Chop, Cold Drinks, etc.).

## Customizing the Menu

To add, edit, or remove menu items, simply open your Google Sheet and edit the `Menu` tab. 
- Ensure `inStock` is set to `TRUE` for items you want to display, and `FALSE` for sold-out items.
- Ensure `isVeg` is correctly set to `TRUE` or `FALSE` so the Veg-Only filter works accurately.
- Changes made in the Google Sheet will reflect in the app upon reloading.

---
*Built for fast, efficient, and hassle-free canteen management.*
