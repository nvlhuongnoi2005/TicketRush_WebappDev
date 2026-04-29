from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from models.order import OrderStatus


class OrderItemOut(BaseModel):
    id: int
    seat_id: int
    seat_label: Optional[str] = None
    section_name: Optional[str] = None
    price: float

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    seat_ids: List[int]     # danh sách seat_id đang locked bởi user này
    event_id: Optional[int] = None


class OrderOut(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: OrderStatus
    created_at: datetime
    expires_at: Optional[datetime]
    paid_at: Optional[datetime]
    items: List[OrderItemOut] = []

    model_config = {"from_attributes": True}
