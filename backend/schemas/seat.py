from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from models.seat import SeatStatus


class SeatOut(BaseModel):
    id: int
    section_id: int
    row_num: int
    col_num: int
    label: str
    status: SeatStatus
    price: Optional[float] = None           # lấy từ section
    lock_expires_at: Optional[datetime] = None
    locked_by_me: Optional[bool] = False    # true nếu current user đang giữ ghế này

    model_config = {"from_attributes": True}


class SeatMapSection(BaseModel):
    section_id: int
    section_name: str
    rows: int
    cols: int
    price: float
    color: str
    seats: List[SeatOut]


class SeatMapOut(BaseModel):
    event_id: int
    sections: List[SeatMapSection]


class LockSeatRequest(BaseModel):
    seat_ids: List[int]


class LockSeatResult(BaseModel):
    success: List[int]      # seat_ids đã khóa thành công
    failed: List[int]       # seat_ids bị từ chối (đã có người giữ)
    lock_expires_at: Optional[datetime] = None
