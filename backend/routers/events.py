from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.event import Event, EventStatus, SeatSection
from models.seat import Seat, SeatStatus
from schemas.event import EventListOut, EventOut, SeatSectionOut
from schemas.seat import SeatMapOut, SeatMapSection, SeatOut
from core.deps import get_optional_user

router = APIRouter(prefix="/api/events", tags=["Events"])


def _enrich_section(section: SeatSection) -> SeatSectionOut:
    total = len(section.seats)
    available = sum(1 for s in section.seats if s.status == SeatStatus.available)
    return SeatSectionOut(
        id=section.id,
        name=section.name,
        rows=section.rows,
        cols=section.cols,
        price=section.price,
        color=section.color,
        total_seats=total,
        available_seats=available,
    )


@router.get("", response_model=List[EventListOut])
def list_events(
    search: Optional[str] = Query(None),
    status: Optional[EventStatus] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Event).filter(Event.status != EventStatus.draft)
    if search:
        q = q.filter(
            Event.title.ilike(f"%{search}%") | Event.artist.ilike(f"%{search}%")
        )
    if status:
        q = q.filter(Event.status == status)

    events = q.order_by(Event.event_date).all()
    result = []
    for ev in events:
        all_seats = [s for sec in ev.sections for s in sec.seats]
        result.append(EventListOut(
            id=ev.id,
            title=ev.title,
            artist=ev.artist,
            venue_name=ev.venue_name,
            event_date=ev.event_date,
            banner_url=ev.banner_url,
            status=ev.status,
            min_price=min((sec.price for sec in ev.sections), default=None),
            total_seats=len(all_seats),
            available_seats=sum(1 for s in all_seats if s.status == SeatStatus.available),
        ))
    return result


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")

    sections_out = [_enrich_section(sec) for sec in event.sections]
    return EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        artist=event.artist,
        venue_name=event.venue_name,
        venue_address=event.venue_address,
        event_date=event.event_date,
        sale_start=event.sale_start,
        sale_end=event.sale_end,
        banner_url=event.banner_url,
        status=event.status,
        queue_enabled=event.queue_enabled,
        sections=sections_out,
    )


@router.get("/{event_id}/seats", response_model=SeatMapOut)
def get_seat_map(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """Trả về toàn bộ sơ đồ ghế cho sự kiện (dùng cho polling và render ghế)."""
    event = (
        db.query(Event)
        .options(joinedload(Event.sections).joinedload(SeatSection.seats))
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")

    sections_out = []
    for sec in event.sections:
        seats_out = []
        for seat in sorted(sec.seats, key=lambda s: (s.row_num, s.col_num)):
            locked_by_me = (
                current_user is not None
                and seat.locked_by == current_user.id
                and seat.status == SeatStatus.locked
            )
            seats_out.append(SeatOut(
                id=seat.id,
                section_id=seat.section_id,
                row_num=seat.row_num,
                col_num=seat.col_num,
                label=seat.label or f"{sec.name}-{seat.row_num}-{seat.col_num}",
                status=seat.status,
                price=sec.price,
                lock_expires_at=seat.lock_expires_at,
                locked_by_me=locked_by_me,
            ))
        sections_out.append(SeatMapSection(
            section_id=sec.id,
            section_name=sec.name,
            rows=sec.rows,
            cols=sec.cols,
            price=sec.price,
            color=sec.color,
            seats=seats_out,
        ))
    return SeatMapOut(event_id=event_id, sections=sections_out)
