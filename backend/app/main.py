from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List
import logging
import io
from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from .database import supabase
from .schemas import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse,
    SaleCreate,
    DashboardMetrics
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Cricket Equipment Stock Maintenance API",
    description="Backend service for tracking cricket inventory and sales",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production security if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Cricket Equipment Stock Maintenance API is active."}

@app.get("/api/dashboard/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics():
    try:
        response = supabase.table("equipment").select("*").execute()
        items = response.data or []
        
        total_investment = sum(item["current_stock"] * float(item["cost_price"]) for item in items)
        potential_revenue = sum(item["current_stock"] * float(item["selling_price"]) for item in items)
        potential_profit = potential_revenue - total_investment
        
        low_stock_alerts = [
            item for item in items 
            if item["current_stock"] <= item["min_stock_threshold"]
        ]
        
        total_unique_items = len(items)
        total_stock_count = sum(item["current_stock"] for item in items)
        
        return {
            "total_investment": total_investment,
            "potential_revenue": potential_revenue,
            "potential_profit": potential_profit,
            "low_stock_count": len(low_stock_alerts),
            "low_stock_alerts": low_stock_alerts,
            "total_unique_items": total_unique_items,
            "total_stock_count": total_stock_count
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/api/inventory", response_model=List[EquipmentResponse])
def get_inventory():
    try:
        # Fetch inventory, sort alphabetically by name
        response = supabase.table("equipment").select("*").order("name").execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching inventory: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/api/inventory/export")
def export_inventory_excel():
    """Export the full inventory catalog as a styled .xlsx file."""
    try:
        response = supabase.table("equipment").select("*").order("name").execute()
        items = response.data or []
    except Exception as e:
        logger.error(f"Error fetching inventory for export: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

    wb = Workbook()
    ws = wb.active
    ws.title = "Inventory Catalog"

    # --- Styles ---
    header_fill   = PatternFill("solid", fgColor="0A251C")   # dark cricket-pitch green
    header_font   = Font(bold=True, color="C5A85A", name="Calibri", size=11)
    alt_row_fill  = PatternFill("solid", fgColor="F1F5F9")   # light slate
    border_side   = Side(style="thin", color="CBD5E1")
    cell_border   = Border(
        left=border_side, right=border_side,
        top=border_side, bottom=border_side
    )
    center_align  = Alignment(horizontal="center", vertical="center")
    left_align    = Alignment(horizontal="left",   vertical="center")

    headers = [
        "name", "category", "current_stock",
        "min_stock_threshold", "cost_price", "selling_price", "created_at"
    ]
    display_headers = [
        "Item Name", "Category", "Current Stock",
        "Min Stock Threshold", "Cost Price", "Selling Price", "Date Arrived"
    ]

    # Write header row
    for col_num, header_text in enumerate(display_headers, start=1):
        cell = ws.cell(row=1, column=col_num, value=header_text)
        cell.font      = header_font
        cell.fill      = header_fill
        cell.alignment = center_align
        cell.border    = cell_border

    # Write data rows
    for row_num, item in enumerate(items, start=2):
        fill = alt_row_fill if row_num % 2 == 0 else None
        for col_num, field in enumerate(headers, start=1):
            value = item.get(field, "")
            cell  = ws.cell(row=row_num, column=col_num, value=value)
            cell.border    = cell_border
            cell.alignment = center_align if col_num >= 3 else left_align
            if fill:
                cell.fill = fill

    # Auto-size columns
    col_widths = [30, 16, 16, 22, 14, 16, 22]
    for idx, width in enumerate(col_widths, start=1):
        ws.column_dimensions[get_column_letter(idx)].width = width

    ws.row_dimensions[1].height = 22

    # Stream as HTTP response
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=inventory_catalog.xlsx"}
    )

@app.post("/api/inventory", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
def add_inventory_item(item: EquipmentCreate):
    try:
        payload = item.model_dump()
        response = supabase.table("equipment").insert(payload).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create equipment item"
            )
        return response.data[0]
    except Exception as e:
        logger.error(f"Error adding inventory item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.put("/api/inventory/{id}", response_model=EquipmentResponse)
def update_inventory_item(id: str, item: EquipmentUpdate):
    try:
        # Remove None fields to avoid overwriting existing properties with null
        payload = {k: v for k, v in item.model_dump().items() if v is not None}
        if not payload:
            # Nothing to update, retrieve original
            response = supabase.table("equipment").select("*").eq("id", id).execute()
            if not response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
            return response.data[0]
            
        response = supabase.table("equipment").update(payload).eq("id", id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found or failed to update"
            )
        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating inventory item {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.delete("/api/inventory/{id}")
def delete_inventory_item(id: str):
    try:
        response = supabase.table("equipment").delete().eq("id", id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found or already deleted"
            )
        return {"message": "Item deleted successfully", "id": id}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting inventory item {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.post("/api/sales")
def log_sale(sale: SaleCreate):
    try:
        # Call the PostgreSQL RPC stored procedure to safely execute stock decrement
        # and sale logging in a transaction.
        response = supabase.rpc("log_sale", {
            "p_equipment_id": sale.equipment_id,
            "p_quantity_sold": sale.quantity_sold,
            "p_sale_price": sale.sale_price
        }).execute()
        
        # response.data returns the new stock levels
        new_stock = response.data
        
        return {
            "message": "Sale logged successfully",
            "equipment_id": sale.equipment_id,
            "quantity_sold": sale.quantity_sold,
            "sale_price": sale.sale_price,
            "new_stock": new_stock
        }
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Error logging sale: {err_msg}")
        
        # Check database raised exceptions
        if "Insufficient stock" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err_msg
            )
        elif "Equipment item not found" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipment item not found."
            )
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error: {err_msg}"
        )

@app.post("/api/inventory/upload")
async def upload_inventory_excel(file: UploadFile = File(...)):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a standard Excel file (.xlsx or .xls)."
        )

    try:
        contents = await file.read()
        wb = load_workbook(filename=io.BytesIO(contents), data_only=True)
        ws = wb.active
    except Exception as e:
        logger.error(f"Error parsing Excel file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read Excel file structure: {str(e)}"
        )

    # Extract headers
    try:
        first_row = next(ws.iter_rows(max_row=1))
        headers = [str(cell.value).strip().lower() if cell.value is not None else "" for cell in first_row]
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded Excel sheet appears to be empty."
        )

    required_cols = ["name", "category", "current_stock", "cost_price", "selling_price"]
    for col in required_cols:
        if col not in headers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required column '{col}'. Excel sheet must have headers: name, category, current_stock, cost_price, selling_price"
            )

    name_idx = headers.index("name")
    category_idx = headers.index("category")
    stock_idx = headers.index("current_stock")
    cost_idx = headers.index("cost_price")
    sell_idx = headers.index("selling_price")
    threshold_idx = headers.index("min_stock_threshold") if "min_stock_threshold" in headers else -1

    VALID_CATEGORIES = {'Bats', 'Balls', 'Gloves', 'Pads', 'Helmets', 'Accessories', 'Bags', 'Clothing'}
    imported_count = 0
    updated_count = 0
    errors = []

    for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        # Skip fully empty rows
        if not row or all(cell is None for cell in row):
            continue

        try:
            name = str(row[name_idx]).strip() if row[name_idx] is not None else ""
            if not name:
                errors.append(f"Row {row_num}: Item name cannot be empty.")
                continue

            category = str(row[category_idx]).strip() if row[category_idx] is not None else ""
            category_normalized = category.capitalize()
            
            # Simple singular to plural conversions to help user imports
            if category_normalized not in VALID_CATEGORIES:
                if category_normalized == 'Bat':
                    category_normalized = 'Bats'
                elif category_normalized == 'Ball':
                    category_normalized = 'Balls'
                elif category_normalized == 'Glove':
                    category_normalized = 'Gloves'
                elif category_normalized == 'Pad':
                    category_normalized = 'Pads'
                elif category_normalized == 'Helmet':
                    category_normalized = 'Helmets'
                elif category_normalized == 'Bag':
                    category_normalized = 'Bags'
                elif category_normalized == 'Accessory':
                    category_normalized = 'Accessories'

            if category_normalized not in VALID_CATEGORIES:
                errors.append(f"Row {row_num} ('{name}'): Invalid category '{category}'. Must be one of {list(VALID_CATEGORIES)}.")
                continue

            # Parse stock
            try:
                current_stock = int(row[stock_idx])
                if current_stock < 0:
                    errors.append(f"Row {row_num} ('{name}'): Stock level cannot be negative.")
                    continue
            except (ValueError, TypeError):
                errors.append(f"Row {row_num} ('{name}'): Invalid current_stock value.")
                continue

            # Parse cost price
            try:
                cost_price = float(row[cost_idx])
                if cost_price < 0:
                    errors.append(f"Row {row_num} ('{name}'): Cost price cannot be negative.")
                    continue
            except (ValueError, TypeError):
                errors.append(f"Row {row_num} ('{name}'): Invalid cost_price value.")
                continue

            # Parse selling price
            try:
                selling_price = float(row[sell_idx])
                if selling_price < 0:
                    errors.append(f"Row {row_num} ('{name}'): Selling price cannot be negative.")
                    continue
            except (ValueError, TypeError):
                errors.append(f"Row {row_num} ('{name}'): Invalid selling_price value.")
                continue

            # Parse min stock threshold
            min_stock_threshold = 5
            if threshold_idx != -1 and row[threshold_idx] is not None:
                try:
                    min_stock_threshold = int(row[threshold_idx])
                    if min_stock_threshold < 0:
                        min_stock_threshold = 5
                except (ValueError, TypeError):
                    pass

            payload = {
                "name": name,
                "category": category_normalized,
                "current_stock": current_stock,
                "min_stock_threshold": min_stock_threshold,
                "cost_price": cost_price,
                "selling_price": selling_price
            }

            # Check if item exists in db by name (exact check)
            check_res = supabase.table("equipment").select("id").eq("name", name).execute()

            if check_res.data:
                # Update existing
                item_id = check_res.data[0]["id"]
                supabase.table("equipment").update(payload).eq("id", item_id).execute()
                updated_count += 1
            else:
                # Insert new
                supabase.table("equipment").insert(payload).execute()
                imported_count += 1

        except Exception as e:
            errors.append(f"Row {row_num}: Database error during import: {str(e)}")

    return {
        "message": "Import completed.",
        "imported_count": imported_count,
        "updated_count": updated_count,
        "errors": errors
    }
