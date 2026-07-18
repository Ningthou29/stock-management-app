# stock-management-app
Here is a clean, comprehensive, and professional README.md file for your full-stack Cricket Equipment Stock Maintenance application. It covers everything from project setup to the directory structure.Markdown# 🏏 Cricket Equipment Stock Maintenance Web App

A full-stack inventory management and analytics web application tailored for cricket gear storefronts and warehouses. The app tracks stock levels, calculates real-time financial metrics (Investments, Revenue, and Projected Profits), alerts users to low stock thresholds, and maintains an active sales log ledger.

---

## 🚀 Tech Stack

*   **Frontend:** React (Vite, TypeScript, Tailwind CSS, shadcn/ui components)
*   **Backend:** FastAPI (Python, Pydantic, Uvicorn)
*   **Database:** Supabase (PostgreSQL relational architecture)

---

## 📦 Directory Structure

```text
stock-management-app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application entry & API routers
│   │   ├── database.py      # Supabase client initialization
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   └── config.py        # Environment variables parser
│   ├── requirements.txt     # Python backend dependencies
│   └── .env                 # Backend environment secrets
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/      # UI Modals, tables, and metric cards
│   │   ├── App.tsx          # Main layout interface
│   │   └── main.tsx
│   ├── .env                 # Frontend API configuration variables
│   ├── package.json         # Frontend Node dependencies
│   └── vite.config.ts
└── supabase/
    └── migration.sql        # Database table initialization scripts
🛠️ Installation & Setup1. Database Configuration (Supabase)Set up a free project on Supabase.Grab your Project URL and Anon Public API Key from your Supabase dashboard settings.Open the SQL Editor in Supabase, paste the contents of supabase/migration.sql into a query panel, and execute it to create your equipment and sales_log tables.2. Backend Setup (FastAPI)Navigate to the backend directory and set up a virtual environment:Bashcd backend
python -m venv venv

# Activate environment:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
Create a .env file in the root of the backend/ folder and insert your credentials:Code snippetSUPABASE_URL="[https://your-project-id.supabase.co](https://your-project-id.supabase.co)"
SUPABASE_ANON_KEY="your-supabase-anon-public-key"
Start the FastAPI server:Bashuvicorn app.main:app --reload
Your backend service will be live at http://localhost:8000 (API documentation accessible at http://localhost:8000/docs).3. Frontend Setup (React)Open a new terminal session, navigate to the frontend folder, and install your node packages:Bashcd frontend
npm install
Create a .env file inside the frontend/ folder to tell React where to find your FastAPI backend:Code snippetVITE_API_URL="http://localhost:8000"
Launch the Vite development server:Bashnpm run dev
Your user interface will be running locally at http://localhost:5173.💡 Key Features & Workflows📈 Business Health Analytics DashboardTotal Investment: Instantly tallies value spent on current stock: $\sum(\text{Stock} \times \text{Cost Price})$.Potential Revenue & Profit: Displays projected margins if products sell out at standard retail pricing.Low Stock Indicators: Generates automatic warnings if stock values slide beneath your custom safety thresholds.📋 Inventory Management Data TableAllows sorting, searching, and filtering of items by specific tags or cricket categories (Bats, Balls, Helmets, Gloves, Pads).Inline CRUD options to update quantities, refine listing prices, or quickly add whole new shipments.⚡ Quick-Sell TransactionsEnables store operators to log customer transactions immediately using a minimal overlay window.Deducts items from database records instantly and appends the details safely to the immutable sales_log history tracking matrix.⚠️ Troubleshooting API RoutingIf your terminal logs show 404 Not Found messages hitting /api/api/..., your frontend configurations are accidentally duplicating endpoint strings. Ensure that your frontend/.env variables point explicitly to the base URL host root domain (http://localhost:8000) without trailing slashes or subpaths!
