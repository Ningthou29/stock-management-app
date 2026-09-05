import sys
import os
from unittest.mock import MagicMock, patch

# Ensure backend folder is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Create mock for Supabase table methods
mock_supabase = MagicMock()

# Patch the supabase client in app.database BEFORE importing main
with patch('app.database.supabase', mock_supabase):
    from app.main import app
    from fastapi.testclient import TestClient

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "active" in response.json()["message"]

def test_get_dashboard_metrics_empty():
    # Mock supabase response for empty inventory
    mock_result = MagicMock()
    mock_result.data = []
    
    mock_supabase.table.return_value.select.return_value.execute.return_value = mock_result
    
    with patch('app.main.supabase', mock_supabase):
        response = client.get("/api/dashboard/metrics")
        assert response.status_code == 200
        data = response.json()
        assert data["total_investment"] == 0.0
        assert data["potential_revenue"] == 0.0
        assert data["potential_profit"] == 0.0
        assert data["low_stock_count"] == 0
        assert data["total_unique_items"] == 0
        assert data["total_stock_count"] == 0

def test_get_dashboard_metrics_populated():
    # Mock supabase response with items
    mock_result = MagicMock()
    mock_result.data = [
        {
            "id": "item1-uuid",
            "name": "Kookaburra Bat",
            "category": "Bats",
            "current_stock": 10,
            "min_stock_threshold": 5,
            "cost_price": 100.0,
            "selling_price": 150.0,
            "created_at": "2026-07-15T23:00:00Z"
        },
        {
            "id": "item2-uuid",
            "name": "SG Balls",
            "category": "Balls",
            "current_stock": 2,
            "min_stock_threshold": 5,
            "cost_price": 10.0,
            "selling_price": 20.0,
            "created_at": "2026-07-15T23:00:00Z"
        }
    ]
    
    mock_supabase.table.return_value.select.return_value.execute.return_value = mock_result
    
    with patch('app.main.supabase', mock_supabase):
        response = client.get("/api/dashboard/metrics")
        assert response.status_code == 200
        data = response.json()
        
        # total_investment = 10 * 100 + 2 * 10 = 1020
        # potential_revenue and potential_profit are 0 (selling_price removed)
        # SG Balls has current_stock (2) <= min_stock_threshold (5) -> 1 low stock alert
        assert data["total_investment"] == 1020.0
        assert data["potential_revenue"] == 0.0
        assert data["potential_profit"] == 0.0
        assert data["low_stock_count"] == 1
        assert data["low_stock_alerts"][0]["name"] == "SG Balls"
        assert data["total_unique_items"] == 2
        assert data["total_stock_count"] == 12

def test_get_inventory():
    mock_result = MagicMock()
    mock_result.data = [
        {
            "id": "item1-uuid",
            "name": "SS Gloves",
            "category": "Gloves",
            "current_stock": 8,
            "min_stock_threshold": 3,
            "cost_price": 25.0,
            "selling_price": 40.0,
            "created_at": "2026-07-15T23:00:00Z"
        }
    ]
    
    mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value = mock_result
    
    with patch('app.main.supabase', mock_supabase):
        response = client.get("/api/inventory")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "SS Gloves"

def test_add_inventory_item():
    mock_result = MagicMock()
    mock_result.data = [
        {
            "id": "new-uuid",
            "name": "GM Pad",
            "category": "Pads",
            "current_stock": 15,
            "min_stock_threshold": 4,
            "cost_price": 30.0,
            "selling_price": 55.0,
            "created_at": "2026-07-15T23:00:00Z"
        }
    ]
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result
    
    with patch('app.main.supabase', mock_supabase):
        payload = {
            "name": "GM Pad",
            "category": "Pads",
            "current_stock": 15,
            "min_stock_threshold": 4,
            "cost_price": 30.0,
            "selling_price": 55.0
        }
        response = client.post("/api/inventory", json=payload)
        assert response.status_code == 201
        assert response.json()["id"] == "new-uuid"

def test_log_sale():
    mock_result = MagicMock()
    mock_result.data = 8  # RPC returns new stock level (10 - 2 = 8)
    
    mock_supabase.rpc.return_value.execute.return_value = mock_result
    
    with patch('app.main.supabase', mock_supabase):
        payload = {
            "equipment_id": "some-uuid",
            "quantity_sold": 2,
            "sale_price": 150.0
        }
        response = client.post("/api/sales", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["new_stock"] == 8
        assert data["quantity_sold"] == 2
        assert "success" in data["message"]
