from datetime import datetime, timedelta, timezone
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
from schemas.admin import DashboardOut, RevenuePoint, SeatFillSection, AudienceStat, EventDashboardOut, AiInsight, AiInsightsRequest, AiInsightsResponse
from models.queue import QueueEntry
from services.ai_service import generate_insights


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
    return [_event_out(e, db) for e in events]


@router.get("/events/{event_id}", response_model=EventOut)
def get_event_admin(event_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")
    return _event_out(event, db)


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
    return _event_out(event, db)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    from models.order import OrderItem
    from models.queue import QueueEntry
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")

    # Collect all seat IDs before cascade removes them
    seat_ids = [seat.id for sec in event.sections for seat in sec.seats]

    # Cancel pending orders that contain seats from this event
    if seat_ids:
        affected_order_ids = (
            db.query(OrderItem.order_id)
            .filter(OrderItem.seat_id.in_(seat_ids))
            .distinct()
            .subquery()
        )
        db.query(Order).filter(
            Order.id.in_(affected_order_ids),
            Order.status == OrderStatus.pending,
        ).update({"status": OrderStatus.cancelled}, synchronize_session=False)

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

@router.get("/dashboard/event/{event_id}", response_model=EventDashboardOut)
def get_event_dashboard(
    event_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Dashboard riêng cho 1 sự kiện cụ thể."""
    from models.order import OrderItem
    from schemas.admin import RevenuePoint

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")

    # ─── Seat aggregation ────────────────────────────────────────────────
    total_seats = sold_seats = locked_seats = 0
    for sec in event.sections:
        for s in sec.seats:
            total_seats += 1
            if s.status == SeatStatus.sold:
                sold_seats += 1
            elif s.status == SeatStatus.locked:
                locked_seats += 1
    available_seats = total_seats - sold_seats - locked_seats

    section_ids = [sec.id for sec in event.sections]

    # ─── Vé đã phát hành cho event này ────────────────────────────────────
    tickets_sold = (
        db.query(func.count(Ticket.id))
        .filter(Ticket.event_id == event_id)
        .scalar() or 0
    )

    # ─── Doanh thu CHÍNH XÁC: cộng dồn price từ OrderItem của event này ─
    # Lý do: 1 Order có thể chứa item từ nhiều event nên KHÔNG được cộng total_amount.
    revenue = 0
    pending_orders = 0
    if section_ids:
        revenue = (
            db.query(func.coalesce(func.sum(OrderItem.price), 0))
            .join(Seat, Seat.id == OrderItem.seat_id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(
                Seat.section_id.in_(section_ids),
                Order.status == OrderStatus.paid,
            )
            .scalar() or 0
        )

        pending_orders = (
            db.query(func.count(func.distinct(Order.id)))
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Seat, Seat.id == OrderItem.seat_id)
            .filter(
                Seat.section_id.in_(section_ids),
                Order.status == OrderStatus.pending,
            )
            .scalar() or 0
        )

    # ─── Doanh thu 7 ngày của event này ──────────────────────────────────
    recent = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        rev = 0
        if section_ids:
            rev = (
                db.query(func.coalesce(func.sum(OrderItem.price), 0))
                .join(Seat, Seat.id == OrderItem.seat_id)
                .join(Order, Order.id == OrderItem.order_id)
                .filter(
                    Seat.section_id.in_(section_ids),
                    Order.status == OrderStatus.paid,
                    Order.paid_at >= day_start,
                    Order.paid_at < day_end,
                )
                .scalar() or 0
            )

        cnt = (
            db.query(func.count(Ticket.id))
            .filter(
                Ticket.event_id == event_id,
                Ticket.issued_at >= day_start,
                Ticket.issued_at < day_end,
            )
            .scalar() or 0
        )
        recent.append(RevenuePoint(date=str(day), revenue=rev, tickets_sold=cnt))

    # ─── Audience cho event này (chỉ buyers đã có vé của event) ─────────
    audience = _audience_for_event(db, event_id)

    fill_pct = round((sold_seats / total_seats * 100) if total_seats else 0, 1)
    avg_price = (revenue / tickets_sold) if tickets_sold else 0

    return EventDashboardOut(
        event_id=event.id,
        title=event.title,
        status=event.status.value if hasattr(event.status, "value") else str(event.status),
        venue_name=event.venue_name,
        banner_url=event.banner_url,
        event_date=str(event.event_date) if event.event_date else None,
        revenue=revenue,
        tickets_sold=tickets_sold,
        pending_orders=pending_orders,
        total_seats=total_seats,
        available_seats=available_seats,
        sold_seats=sold_seats,
        locked_seats=locked_seats,
        fill_pct=fill_pct,
        avg_ticket_price=avg_price,
        recent_revenue=recent,
        sections_count=len(event.sections),
        audience=audience,
    )


def _audience_for_event(db: Session, event_id: int) -> "AudienceStat":
    """Thống kê demographic của buyers chỉ thuộc 1 event."""
    from schemas.admin import AudienceStat

    buyers = (
        db.query(User)
        .join(Ticket, Ticket.user_id == User.id)
        .filter(Ticket.event_id == event_id)
        .distinct()
        .all()
    )
    return _compute_audience(buyers)


def _compute_audience(buyers) -> "AudienceStat":
    """Helper chung: tính demographic từ list users."""
    from schemas.admin import AudienceStat

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
    """Thống kê toàn bộ buyers."""
    buyers = db.query(User).join(Ticket, Ticket.user_id == User.id).distinct().all()
    return _compute_audience(buyers)


def _event_out(event: Event, db: Session = None) -> EventOut:
    from schemas.event import SeatSectionOut
    sections = []
    for sec in event.sections:
        total = len(sec.seats)
        avail = sum(1 for s in sec.seats if s.status == SeatStatus.available)
        sections.append(SeatSectionOut(
            id=sec.id, name=sec.name, rows=sec.rows, cols=sec.cols,
            price=sec.price, color=sec.color, total_seats=total, available_seats=avail,
        ))
    
    tickets_sold = 0
    revenue = 0.0
    if db is not None:
        tickets_sold = db.query(func.count(Ticket.id)).filter(
            Ticket.event_id == event.id
        ).scalar() or 0
        
        # Tính revenue từ OrderItem paid
        from models.order import OrderItem
        section_ids = [sec.id for sec in event.sections]
        if section_ids:
            revenue = db.query(
                func.coalesce(func.sum(OrderItem.price), 0)
            ).join(Seat, Seat.id == OrderItem.seat_id
            ).join(Order, Order.id == OrderItem.order_id
            ).filter(
                Seat.section_id.in_(section_ids),
                Order.status == OrderStatus.paid,
            ).scalar() or 0.0
    
    return EventOut(
        id=event.id, title=event.title, description=event.description,
        artist=event.artist, venue_name=event.venue_name, venue_address=event.venue_address,
        event_date=event.event_date, sale_start=event.sale_start, sale_end=event.sale_end,
        banner_url=event.banner_url, status=event.status, queue_enabled=event.queue_enabled,
        sections=sections,
        tickets_sold=tickets_sold,
        revenue=revenue,
    )

# ─── AI Insights ────────────────────────────────────────────────────

@router.post("/ai-insights", response_model=AiInsightsResponse)
async def ai_insights(
    body: AiInsightsRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Gọi Gemini để sinh insights - chỉ chạy khi admin bấm nút."""

    # Build stats payload
    stats = {}

    if body.scope == "all":
        # Toàn hệ thống
        total_events = db.query(func.count(Event.id)).scalar() or 0
        active_events = db.query(func.count(Event.id)).filter(Event.status == EventStatus.on_sale).scalar() or 0
        total_sold = db.query(func.count(Ticket.id)).scalar() or 0
        total_revenue = db.query(func.sum(Order.total_amount)).filter(Order.status == OrderStatus.paid).scalar() or 0

        # 7 ngày
        recent = []
        for i in range(6, -1, -1):
            day = datetime.utcnow().date() - timedelta(days=i)
            ds = datetime.combine(day, datetime.min.time())
            de = ds + timedelta(days=1)
            rev = db.query(func.sum(Order.total_amount)).filter(
                Order.status == OrderStatus.paid,
                Order.paid_at >= ds, Order.paid_at < de,
            ).scalar() or 0
            recent.append({"date": str(day), "revenue": int(rev)})

        # Audience
        buyers = db.query(User).join(Ticket, Ticket.user_id == User.id).distinct().all()
        male = sum(1 for u in buyers if (u.gender or "").lower() == "male")
        female = sum(1 for u in buyers if (u.gender or "").lower() == "female")
        other = len(buyers) - male - female

        stats = {
            "scope": "Toàn hệ thống",
            "total_events": total_events,
            "active_events": active_events,
            "total_tickets_sold": total_sold,
            "total_revenue_vnd": int(total_revenue),
            "avg_ticket_price_vnd": int(total_revenue / total_sold) if total_sold else 0,
            "active_ratio_pct": round(active_events / total_events * 100, 1) if total_events else 0,
            "recent_7days_revenue": recent,
            "audience": {
                "total_buyers": len(buyers),
                "male": male,
                "female": female,
                "other": other,
            },
        }

    elif body.event_id:
        event = db.query(Event).filter(Event.id == body.event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")

        # Lấy lại data từ event dashboard (gọi nội bộ)
        ev_data = get_event_dashboard(body.event_id, db, None)

        # Seat stats
        section_stats = []
        for sec in event.sections:
            total = len(sec.seats)
            sold = sum(1 for s in sec.seats if s.status == SeatStatus.sold)
            section_stats.append({
                "name": sec.name,
                "total": total,
                "sold": sold,
                "fill_pct": round(sold / total * 100, 1) if total else 0,
                "price_vnd": int(sec.price),
            })

        stats = {
            "scope": f"Sự kiện: {event.title}",
            "event_status": ev_data.status,
            "venue": event.venue_name,
            "event_date": ev_data.event_date,
            "tickets_sold": ev_data.tickets_sold,
            "revenue_vnd": int(ev_data.revenue),
            "total_seats": ev_data.total_seats,
            "fill_pct": ev_data.fill_pct,
            "avg_ticket_price_vnd": int(ev_data.avg_ticket_price),
            "sections": section_stats,
            "recent_7days_revenue": [{"date": r.date, "revenue": int(r.revenue)} for r in ev_data.recent_revenue],
        }
    else:
        raise HTTPException(status_code=400, detail="Phải chọn scope='all' hoặc cung cấp event_id")

    result = await generate_insights(stats)

    return AiInsightsResponse(
        insights=[AiInsight(**it) for it in result["insights"]],
        summary=result.get("summary"),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )