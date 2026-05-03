from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from models.event import EventStatus


# ─── SeatSection ───────────────────────────────────────────────────────────────

class SeatSectionCreate(BaseModel):
    name: str
    rows: int
    cols: int
    price: float
    color: Optional[str] = "#4CAF50"


class SeatSectionUpdate(BaseModel):
    name: Optional[str] = None
    rows: Optional[int] = None
    cols: Optional[int] = None
    price: Optional[float] = None
    color: Optional[str] = None


class SeatSectionOut(BaseModel):
    id: int
    name: str
    rows: int
    cols: int
    price: float
    color: str
    total_seats: Optional[int] = None
    available_seats: Optional[int] = None

    model_config = {"from_attributes": True}


# ─── Event ─────────────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    artist: Optional[str] = None
    venue_name: str
    venue_address: Optional[str] = None
    event_date: datetime
    sale_start: Optional[datetime] = None
    sale_end: Optional[datetime] = None
    banner_url: Optional[str] = None
    queue_enabled: Optional[bool] = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    artist: Optional[str] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    event_date: Optional[datetime] = None
    sale_start: Optional[datetime] = None
    sale_end: Optional[datetime] = None
    banner_url: Optional[str] = None
    status: Optional[EventStatus] = None
    queue_enabled: Optional[bool] = None


class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    artist: Optional[str]
    venue_name: str
    venue_address: Optional[str]
    event_date: datetime
    sale_start: Optional[datetime]
    sale_end: Optional[datetime]
    banner_url: Optional[str]
    status: EventStatus
    queue_enabled: bool
    sections: List[SeatSectionOut] = []
    tickets_sold: Optional[int] = 0
    revenue: Optional[float] = 0.0

    model_config = {"from_attributes": True}


class EventListOut(BaseModel):
    id: int
    title: str
    artist: Optional[str]
    venue_name: str
    event_date: datetime
    banner_url: Optional[str]
    status: EventStatus
    min_price: Optional[float] = None
    total_seats: Optional[int] = None
    available_seats: Optional[int] = None

    model_config = {"from_attributes": True}
