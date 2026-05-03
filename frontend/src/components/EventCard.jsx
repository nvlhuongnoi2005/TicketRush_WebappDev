import { Link } from 'react-router-dom'

// ─── Status config ──────────────────────────────────────────────────────────
export const STATUS_STYLE = {
    on_sale: { dot: 'bg-emerald-400', badge: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400', label: 'Đang bán' },
    sold_out: { dot: 'bg-rose-400', badge: 'border-rose-400/25 bg-rose-400/10 text-rose-400', label: 'Hết vé' },
    finished: { dot: 'bg-slate-400', badge: 'border-slate-400/25 bg-slate-400/10 text-slate-400', label: 'Đã kết thúc' },
    cancelled: { dot: 'bg-orange-400', badge: 'border-orange-400/25 bg-orange-400/10 text-orange-400', label: 'Đã hủy' },
}

// ─── SVG icons ──────────────────────────────────────────────────────────────
export function IconCalendar() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 opacity-50">
            <rect x="2" y="3" width="12" height="11" rx="2" />
            <path d="M5 2v2M11 2v2M2 7h12" />
        </svg>
    )
}
export function IconPin() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 opacity-50">
            <path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" />
            <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" />
        </svg>
    )
}
function IconSeat() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 opacity-50">
            <path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" />
        </svg>
    )
}
function IconSeatBtn() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" />
        </svg>
    )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
export function SkeletonCard({ isDark }) {
    return (
        <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`h-52 animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
            <div className="space-y-3 p-5">
                <div className={`h-4 w-3/4 animate-pulse rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                <div className={`h-3 w-1/2 animate-pulse rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                <div className={`h-3 w-2/3 animate-pulse rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                <div className={`h-8 w-28 animate-pulse rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
            </div>
        </div>
    )
}

// ─── EventCard ───────────────────────────────────────────────────────────────
export function EventCard({ event, isDark }) {
    const style = STATUS_STYLE[event.status] ?? STATUS_STYLE.finished
    const isOnSale = event.status === 'on_sale'
    const isSoldOut = event.status === 'sold_out'
    const lowStock = isOnSale && event.available_seats != null && event.available_seats < 50

    const formattedDate = event.event_date
        ? new Date(event.event_date).toLocaleString('vi-VN', {
            weekday: 'short', day: '2-digit', month: 'short',
            year: 'numeric', hour: '2-digit', minute: '2-digit',
        })
        : null

    return (
        <article
            className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${isDark
                ? 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-xl hover:shadow-black/40'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70'
                }`}
        >
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden">
                {event.banner_url ? (
                    <img
                        src={event.banner_url}
                        alt={event.title}
                        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isSoldOut ? 'grayscale-[40%]' : ''}`}
                    />
                ) : (
                    <div className={`flex h-full items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-20">
                            <path d="M20 4L36 14v16L20 38 4 30V14Z" /><circle cx="20" cy="20" r="5" />
                        </svg>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/8 to-transparent" />

                {/* status badge */}
                <div className="absolute left-2.5 top-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${style.badge}`}>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                        {style.label}
                    </span>
                </div>

                {/* price chip */}
                {event.min_price && (
                    <div className="absolute bottom-2.5 right-2.5 rounded-xl border border-white/15 bg-black/52 px-2.5 py-1.5 text-right backdrop-blur-sm">
                        <p className="text-[10px] leading-none text-white/55">Từ</p>
                        <p className="mt-0.5 text-[13px] font-semibold leading-none text-white">
                            {Number(event.min_price).toLocaleString('vi-VN')} ₫
                        </p>
                    </div>
                )}

                {/* low stock */}
                {lowStock && (
                    <div className="absolute bottom-2.5 left-2.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 backdrop-blur-sm">
                        <span className="text-[11px] font-medium text-rose-400">Chỉ còn {event.available_seats} ghế!</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                    <h3 className={`line-clamp-2 text-[14px] font-semibold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {event.title}
                    </h3>
                    {event.artist && (
                        <p className={`mt-1 text-xs ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{event.artist}</p>
                    )}
                </div>

                <div className={`space-y-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formattedDate && (
                        <div className="flex items-center gap-1.5"><IconCalendar /><span className="line-clamp-1">{formattedDate}</span></div>
                    )}
                    {event.venue_name && (
                        <div className="flex items-center gap-1.5"><IconPin /><span className="line-clamp-1">{event.venue_name}</span></div>
                    )}
                    {!lowStock && event.available_seats != null && isOnSale && (
                        <div className="flex items-center gap-1.5"><IconSeat /><span>{Number(event.available_seats).toLocaleString('vi-VN')} ghế trống</span></div>
                    )}
                    {isSoldOut && (
                        <div className="flex items-center gap-1.5">
                            <IconSeat />
                            <span className={isDark ? 'text-rose-400' : 'text-rose-500'}>Đã hết vé</span>
                        </div>
                    )}
                </div>

                <div className={`h-px w-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />

                <div className="mt-auto flex items-center gap-2">
                    <Link
                        to={`/events/${event.id}`}
                        className={`flex-1 rounded-xl py-2 text-center text-xs font-semibold transition hover:opacity-88 ${isOnSale
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20'
                            : isDark
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </article>
    )
}

export default EventCard