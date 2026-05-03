from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class QueueJoinRequest(BaseModel):
    session_id: str     # UUID tạo bởi client, dùng để poll status sau


class QueueStatusOut(BaseModel):
    session_id: str
    position: int
    total_in_queue: int
    is_admitted: bool
    access_token: Optional[str] = None      # cấp khi được vào
    token_expires_at: Optional[datetime] = None
    message: str
