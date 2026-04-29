from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
import base64
from sqlalchemy.orm import Session

from database import get_db
from core.deps import get_current_user
from models.user import User
from models.ticket import Ticket
from schemas.ticket import TicketOut

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


def _build_ticket_out(t: Ticket) -> TicketOut:
    seat = t.seat
    section = seat.section if seat else None
    event = t.event
    return TicketOut(
        id=t.id,
        order_id=t.order_id,
        seat_id=t.seat_id,
        event_id=t.event_id,
        seat_label=seat.label if seat else None,
        section_name=section.name if section else None,
        event_title=event.title if event else None,
        event_date=event.event_date if event else None,
        venue_name=event.venue_name if event else None,
        qr_data=t.qr_data,
        qr_image_url=t.qr_image_url,
        status=t.status,
        price=t.price,
        issued_at=t.issued_at,
    )


@router.get("", response_model=List[TicketOut])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tickets = (
        db.query(Ticket)
        .filter(Ticket.user_id == current_user.id)
        .order_by(Ticket.issued_at.desc())
        .all()
    )
    return [_build_ticket_out(t) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.user_id == current_user.id,
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Vé không tồn tại")
    return _build_ticket_out(t)


@router.get("/{ticket_id}/qr", response_class=Response)
def get_ticket_qr_image(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trả về ảnh QR dưới dạng PNG binary."""
    t = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.user_id == current_user.id,
    ).first()
    if not t or not t.qr_image_url:
        raise HTTPException(status_code=404, detail="Không tìm thấy QR code")
    if t.qr_image_url.startswith("data:image/png;base64,"):
        b64 = t.qr_image_url.split(",", 1)[1]
        img_bytes = base64.b64decode(b64)
        return Response(content=img_bytes, media_type="image/png")
    raise HTTPException(status_code=404, detail="QR code không hợp lệ")
