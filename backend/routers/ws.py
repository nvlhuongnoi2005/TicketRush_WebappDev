"""
WebSocket endpoint cho real-time seat status.

Cách dùng:
  ws://localhost:8000/ws/events/{event_id}/seats

Server push JSON mỗi 2 giây với trạng thái tất cả ghế.
Client không cần F5 - ghế chuyển màu tự động theo cập nhật từ server.

Message format:
{
  "event": "seat_update",
  "data": [
    {"seat_id": 1, "status": "locked"},
    {"seat_id": 2, "status": "available"},
    ...
  ]
}
"""
import asyncio
import json
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from database import SessionLocal
from models.seat import Seat

router = APIRouter(tags=["WebSocket"])

# { event_id: set of WebSocket connections }
_connections: Dict[int, Set[WebSocket]] = {}


@router.websocket("/ws/events/{event_id}/seats")
async def seat_status_ws(websocket: WebSocket, event_id: int):
    await websocket.accept()

    if event_id not in _connections:
        _connections[event_id] = set()
    _connections[event_id].add(websocket)

    try:
        while True:
            snapshot = _get_seat_snapshot(event_id)
            await websocket.send_text(json.dumps({
                "event": "seat_update",
                "data": snapshot,
            }))
            await asyncio.sleep(1)  # push mỗi 1 giây
    except WebSocketDisconnect:
        _connections[event_id].discard(websocket)


def _get_seat_snapshot(event_id: int):
    db: Session = SessionLocal()
    try:
        seats = (
            db.query(Seat)
            .join(Seat.section)
            .filter(Seat.section.has(event_id=event_id))
            .all()
        )
        return [{"seat_id": s.id, "status": s.status.value, "label": s.label} for s in seats]
    finally:
        db.close()
