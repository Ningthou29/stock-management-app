from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class EquipmentBase(BaseModel):
    name: str
    category: str
    current_stock: int = Field(default=0, ge=0, description="Current stock level of the item")
    min_stock_threshold: int = Field(default=5, ge=0, description="Alert threshold for low stock")
    cost_price: float = Field(default=0.0, ge=0.0, description="Unit cost price")
    selling_price: Optional[float] = Field(default=0.0, ge=0.0, description="Unit selling price")

class EquipmentCreate(EquipmentBase):
    selling_price: Optional[float] = Field(default=0.0, ge=0.0, description="Unit selling price")
    exit_date: Optional[str] = None
    exit_quantity: Optional[int] = Field(default=0, ge=0)

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    current_stock: Optional[int] = Field(None, ge=0)
    min_stock_threshold: Optional[int] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0.0)
    selling_price: Optional[float] = Field(None, ge=0.0)
    exit_date: Optional[str] = None
    exit_quantity: Optional[int] = Field(None, ge=0)

class EquipmentResponse(EquipmentBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class SaleCreate(BaseModel):
    equipment_id: str
    quantity_sold: int = Field(..., gt=0, description="Number of items sold")
    sale_price: float = Field(..., ge=0.0, description="Price per item sold")

class SaleResponse(BaseModel):
    id: str
    equipment_id: str
    quantity_sold: int
    sale_price: float
    sold_at: datetime

    model_config = {
        "from_attributes": True
    }

class DashboardMetrics(BaseModel):
    total_investment: float
    potential_revenue: float
    potential_profit: float
    low_stock_count: int
    low_stock_alerts: List[EquipmentResponse]
    total_unique_items: int
    total_stock_count: int
