from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.ticket import TicketStatus


class TicketOut(BaseModel):
    id: int
    order_id: int
    seat_id: int
    event_id: int
    seat_label: Optional[str] = None
    section_name: Optional[str] = None
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None
    venue_name: Optional[str] = None
    qr_data: Optional[str] = None
    qr_image_url: Optional[str] = None
    status: TicketStatus
    price: float
    issued_at: datetime

    model_config = {"from_attributes": True}
