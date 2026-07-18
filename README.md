# 🏏 Cricket Equipment Stock Maintenance Web App

A full-stack inventory management and business analytics application tailored for cricket gear storefronts and sports warehouses. This system tracks real-time inventory counts, automates financial performance calculations, alerts operators to low-stock situations, and securely logs point-of-sale transactions.

---

# 🚀 Architectural Tech Stack

- **Frontend User Interface:** React (Vite + TypeScript) styled with Tailwind CSS and modularized with shadcn/ui custom components.
- **Backend REST API:** FastAPI (Python 3.10+) utilizing Pydantic for strict runtime type-checking and request validation.
- **Database Engine:** Supabase (Cloud-hosted PostgreSQL database).

---

# 📂 Directory Layout

```text
stock-management-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application entry & API routers
│   │   ├── database.py      # Supabase client initialization
│   │   ├── schemas.py       # Pydantic data validation schemas
│   │   └── config.py        # Environment variables parser
│   ├── requirements.txt     # Python backend dependencies
│   └── .env                 # Backend environment secrets
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/      # UI Modals, interactive tables, metric cards
│   │   ├── App.tsx          # Core interface layout
│   │   ├── App.css
│   │   ├── index.css        # Tailwind baseline injections
│   │   └── main.tsx
│   ├── .env                 # Frontend API endpoint configuration
│   ├── package.json         # Frontend Node dependencies
│   └── vite.config.ts       # Vite compilation settings
│
└── supabase/
    └── migration.sql        # Database table initialization scripts
```

---

# 📖 User Operations Manual

This section explains how a store employee or business owner can use the application on a daily basis.

## Step 1: Evaluating Store Performance (Dashboard)

Upon launching the application, the dashboard presents an instant financial overview of the current inventory.

### Dashboard Metrics

- **Total Investment**
  - Displays the total amount invested in the current inventory.
  - Calculated as:

    ```
    Current Stock × Cost Price
    ```

- **Projected Profit**
  - Displays the total potential profit if all inventory is sold at its retail price.

- **Low Stock Alerts**
  - Highlights products that have fallen below their minimum stock threshold.

- **Analytics Visualizer**
  - Displays category-wise inventory distribution using graphical charts.

---

## Step 2: Browsing & Searching Inventory

Navigate to the Inventory page to manage stock.

Features include:

- Search products instantly by name or category.
- View:
  - Cost Price
  - Selling Price
  - Current Stock
  - Potential Profit per Unit
  - Total Potential Profit

---

## Step 3: Stocking Up & Price Management

To add new equipment:

1. Click **Add New Equipment**.
2. Enter:
   - Item Name
   - Category
   - Cost Price
   - Selling Price
   - Initial Stock Quantity
3. Click **Save**.

The application immediately:

- Updates the database.
- Refreshes dashboard metrics.
- Updates analytics charts.

### Editing Existing Equipment

Click **Edit** beside any inventory item to modify:

- Name
- Category
- Cost Price
- Selling Price
- Stock Quantity

---

## Step 4: Logging a Sale

To record a customer purchase:

1. Locate the product.
2. Click **Log a Sale**.
3. Enter the quantity sold.
4. Click **Submit**.

The application automatically:

- Deducts sold stock.
- Records the transaction.
- Updates inventory.
- Recalculates dashboard statistics.

---

# 🛠️ Developer Setup Guide

---

## Step 1: Configure Supabase

1. Log in to the Supabase Dashboard.
2. Create a new project.
3. Copy:
   - Project URL
   - Anon Public API Key

Navigate to the SQL Editor and execute the following SQL script.

### Create Equipment Table

```sql
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_threshold INT NOT NULL DEFAULT 5,
    cost_price NUMERIC(10,2) NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Create Sales Log Table

```sql
CREATE TABLE sales_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    quantity_sold INT NOT NULL,
    sale_price NUMERIC(10,2) NOT NULL,
    sold_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# Step 2: Backend Setup (FastAPI)

Navigate into the backend directory.

```bash
cd backend
```

Create a virtual environment.

```bash
python -m venv venv
```

### Activate Environment

**Windows**

```bash
.\venv\Scripts\activate
```

**macOS/Linux**

```bash
source venv/bin/activate
```

Install dependencies.

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

Start the FastAPI server.

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

```
http://localhost:8000
```

Swagger documentation:

```
http://localhost:8000/docs
```

---

# Step 3: Frontend Setup (React)

Navigate into the frontend directory.

```bash
cd frontend
```

Install dependencies.

```bash
npm install
```

Create a `.env` file.

```env
VITE_API_URL=http://localhost:8000
```

Start the Vite development server.

```bash
npm run dev
```

Open the application in your browser.

```
http://localhost:5173
```

---

# ⚠️ Known Issues & Troubleshooting

## 1. Error Loading ASGI App

If you receive:

```
Error loading ASGI app
```

Ensure you start Uvicorn using:

```bash
uvicorn app.main:app --reload
```

Notice the use of a **colon (`:`)** between `main` and `app`.

Incorrect:

```bash
uvicorn app.main.app
```

Correct:

```bash
uvicorn app.main:app
```

---

## 2. 404 Network Errors

If API requests return **404 Not Found**:

- Verify that `VITE_API_URL` is correct.
- Ensure the backend server is running.
- Avoid duplicating API prefixes in frontend requests (e.g., `/api/api/...`).

Example:

```javascript
// Correct
fetch(`${VITE_API_URL}/equipment`)

// Incorrect
fetch(`${VITE_API_URL}/api/equipment`)
```

---

# 🎯 Key Features

- 📦 Inventory Management
- 🏏 Cricket Equipment Tracking
- 📊 Dashboard Analytics
- 💰 Profit Calculation
- 🚨 Low Stock Alerts
- 🛒 Sales Logging
- ☁️ Supabase Cloud Database
- ⚡ FastAPI Backend
- ⚛️ React + TypeScript Frontend
- 🎨 Tailwind CSS Responsive UI
