from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from core.deps import get_current_admin
from models.event import Event, EventStatus, SeatSection
from models.order import Order, OrderStatus
from models.seat import Seat, SeatStatus
from models.ticket import Ticket
from models.user import User
from schemas.event import EventCreate, EventOut, EventUpdate, SeatSectionCreate, SeatSectionOut, SeatSectionUpdate
from schemas.admin import DashboardOut, RevenuePoint, SeatFillSection, AudienceStat
from models.queue import QueueEntry

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ─── Events ────────────────────────────────────────────────────────────────────

@router.post("/events", response_model=EventOut, status_code=201)
def create_event(
    body: EventCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    event = Event(**body.model_dump(), created_by=admin.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventOut(**{**event.__dict__, "sections": []})


@router.get("/events", response_model=List[EventOut])
def list_all_events(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    events = db.query(Event).order_by(Event.created_at.desc()).all()
    return [_event_out(e) for e in events]


@router.get("/events/{event_id}", response_model=EventOut)
def get_event_admin(event_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")
    return _event_out(event)


@router.put("/events/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    body: EventUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return _event_out(event)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    from models.order import OrderItem
    from models.queue import QueueEntry
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")

    # Collect all seat IDs before cascade removes them
    seat_ids = [seat.id for sec in event.sections for seat in sec.seats]

    # Remove every FK-constrained row not covered by ORM cascade
    db.query(Ticket).filter(Ticket.event_id == event_id).delete(synchronize_session=False)
    db.query(QueueEntry).filter(QueueEntry.event_id == event_id).delete(synchronize_session=False)
    if seat_ids:
        db.query(OrderItem).filter(OrderItem.seat_id.in_(seat_ids)).delete(synchronize_session=False)

    db.delete(event)
    db.commit()


# ─── Queue Admin ───────────────────────────────────────────────────────────────

@router.post("/events/{event_id}/queue/admit-all", status_code=200)
def admit_all_queue(event_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """Instantly admit every pending user in the queue (for demo / testing)."""
    from services.queue_service import admit_next_batch
    n = admit_next_batch(db, event_id)
    return {"admitted": n}


@router.delete("/events/{event_id}/queue", status_code=204)
def clear_queue(event_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """Clear all queue entries for an event (reset for demo)."""
    db.query(QueueEntry).filter(QueueEntry.event_id == event_id).delete(synchronize_session=False)
    db.commit()


# ─── Seat Sections ─────────────────────────────────────────────────────────────

@router.post("/events/{event_id}/sections", response_model=SeatSectionOut, status_code=201)
def create_section(
    event_id: int,
    body: SeatSectionCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")

    section = SeatSection(event_id=event_id, **body.model_dump())
    db.add(section)
    db.flush()

    # Tự động tạo ma trận ghế theo rows x cols
    seats = []
    for r in range(1, body.rows + 1):
        for c in range(1, body.cols + 1):
            row_letter = chr(64 + r) if r <= 26 else f"R{r}"
            label = f"{section.name}-{row_letter}{c:02d}"
            seats.append(Seat(
                section_id=section.id,
                row_num=r,
                col_num=c,
                label=label,
                status=SeatStatus.available,
            ))
    db.add_all(seats)
    db.commit()
    db.refresh(section)

    total = len(section.seats)
    return SeatSectionOut(
        id=section.id, name=section.name, rows=section.rows,
        cols=section.cols, price=section.price, color=section.color,
        total_seats=total, available_seats=total,
    )


@router.put("/sections/{section_id}", response_model=SeatSectionOut)
def update_section(
    section_id: int,
    body: SeatSectionUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    section = db.query(SeatSection).filter(SeatSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Khu vực không tồn tại")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(section, field, value)
    db.commit()
    db.refresh(section)
    total = len(section.seats)
    avail = sum(1 for s in section.seats if s.status == SeatStatus.available)
    return SeatSectionOut(
        id=section.id, name=section.name, rows=section.rows,
        cols=section.cols, price=section.price, color=section.color,
        total_seats=total, available_seats=avail,
    )


@router.delete("/sections/{section_id}", status_code=204)
def delete_section(section_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    section = db.query(SeatSection).filter(SeatSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Khu vực không tồn tại")
    db.delete(section)
    db.commit()


# ─── Dashboard & Statistics ────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total_events = db.query(func.count(Event.id)).scalar()
    active_events = db.query(func.count(Event.id)).filter(Event.status == EventStatus.on_sale).scalar()
    total_sold = db.query(func.count(Ticket.id)).scalar()
    total_revenue = db.query(func.sum(Order.total_amount)).filter(Order.status == OrderStatus.paid).scalar() or 0
    pending_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.pending).scalar()

    # Doanh thu 7 ngày gần nhất
    recent = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        rev = db.query(func.sum(Order.total_amount)).filter(
            Order.status == OrderStatus.paid,
            Order.paid_at >= day_start,
            Order.paid_at < day_end,
        ).scalar() or 0
        cnt = db.query(func.count(Ticket.id)).filter(
            Ticket.issued_at >= day_start,
            Ticket.issued_at < day_end,
        ).scalar()
        recent.append(RevenuePoint(date=str(day), revenue=rev, tickets_sold=cnt))

    return DashboardOut(
        total_events=total_events,
        active_events=active_events,
        total_tickets_sold=total_sold,
        total_revenue=total_revenue,
        pending_orders=pending_orders,
        recent_revenue=recent,
    )


@router.get("/stats/seats/{event_id}", response_model=List[SeatFillSection])
def seat_fill_stats(event_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")
    result = []
    for sec in event.sections:
        total = len(sec.seats)
        sold = sum(1 for s in sec.seats if s.status == SeatStatus.sold)
        locked = sum(1 for s in sec.seats if s.status == SeatStatus.locked)
        available = total - sold - locked
        result.append(SeatFillSection(
            section_name=sec.name,
            total=total,
            sold=sold,
            locked=locked,
            available=available,
            fill_pct=round((sold / total * 100) if total else 0, 1),
        ))
    return result


@router.get("/stats/revenue", response_model=List[RevenuePoint])
def revenue_stats(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = []
    for i in range(days - 1, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        rev = db.query(func.sum(Order.total_amount)).filter(
            Order.status == OrderStatus.paid,
            Order.paid_at >= day_start,
            Order.paid_at < day_end,
        ).scalar() or 0
        cnt = db.query(func.count(Ticket.id)).filter(
            Ticket.issued_at >= day_start,
            Ticket.issued_at < day_end,
        ).scalar()
        result.append(RevenuePoint(date=str(day), revenue=rev, tickets_sold=cnt))
    return result


@router.get("/stats/audience", response_model=AudienceStat)
def audience_stats(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """Thống kê theo giới tính và độ tuổi của khán giả đã mua vé."""
    buyers = (
        db.query(User)
        .join(Ticket, Ticket.user_id == User.id)
        .distinct()
        .all()
    )
    stat = AudienceStat(
        gender_male=0, gender_female=0, gender_other=0,
        age_under_18=0, age_18_25=0, age_26_35=0, age_36_45=0, age_above_45=0,
    )
    today = datetime.utcnow().date()
    for u in buyers:
        g = (u.gender or "other").lower()
        if g == "male":
            stat.gender_male += 1
        elif g == "female":
            stat.gender_female += 1
        else:
            stat.gender_other += 1

        if u.dob:
            try:
                parts = u.dob.split("/")
                born = datetime(int(parts[2]), int(parts[1]), int(parts[0])).date()
                age = (today - born).days // 365
                if age < 18:
                    stat.age_under_18 += 1
                elif age <= 25:
                    stat.age_18_25 += 1
                elif age <= 35:
                    stat.age_26_35 += 1
                elif age <= 45:
                    stat.age_36_45 += 1
                else:
                    stat.age_above_45 += 1
            except Exception:
                pass
    return stat


def _event_out(event: Event) -> EventOut:
    from schemas.event import SeatSectionOut
    sections = []
    for sec in event.sections:
        total = len(sec.seats)
        avail = sum(1 for s in sec.seats if s.status == SeatStatus.available)
        sections.append(SeatSectionOut(
            id=sec.id, name=sec.name, rows=sec.rows, cols=sec.cols,
            price=sec.price, color=sec.color, total_seats=total, available_seats=avail,
        ))
    return EventOut(
        id=event.id, title=event.title, description=event.description,
        artist=event.artist, venue_name=event.venue_name, venue_address=event.venue_address,
        event_date=event.event_date, sale_start=event.sale_start, sale_end=event.sale_end,
        banner_url=event.banner_url, status=event.status, queue_enabled=event.queue_enabled,
        sections=sections,
    )
