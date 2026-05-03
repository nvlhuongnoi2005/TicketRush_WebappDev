from typing import List, Optional
from pydantic import BaseModel


class RevenuePoint(BaseModel):
    date: str
    revenue: float
    tickets_sold: int


class SeatFillSection(BaseModel):
    section_name: str
    total: int
    sold: int
    locked: int
    available: int
    fill_pct: float


class AudienceStat(BaseModel):
    gender_male: int
    gender_female: int
    gender_other: int
    age_under_18: int
    age_18_25: int
    age_26_35: int
    age_36_45: int
    age_above_45: int


class DashboardOut(BaseModel):
    total_events: int
    active_events: int
    total_tickets_sold: int
    total_revenue: float
    pending_orders: int
    recent_revenue: List[RevenuePoint] = []

class EventDashboardOut(BaseModel):
    event_id: int
    title: str
    status: str
    venue_name: Optional[str] = None
    banner_url: Optional[str] = None
    event_date: Optional[str] = None
    revenue: float
    tickets_sold: int
    pending_orders: int
    total_seats: int
    available_seats: int
    sold_seats: int
    locked_seats: int
    fill_pct: float
    avg_ticket_price: float
    recent_revenue: List[RevenuePoint]
    sections_count: int
    audience: Optional[AudienceStat] = None


class AiInsight(BaseModel):
    type: str  # 'positive' | 'warning' | 'info'
    text: str


class AiInsightsRequest(BaseModel):
    scope: str  # 'all' | event_id (string)
    event_id: Optional[int] = None


class AiInsightsResponse(BaseModel):
    insights: List[AiInsight]
    summary: Optional[str] = None
    generated_at: str