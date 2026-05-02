import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventsApi } from '../lib/api'
import { useTheme } from '../context/ThemeContext.jsx'
import { EventCard, SkeletonCard } from '../components/EventCard.jsx'

// ─── Constants ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'on_sale', label: 'Đang bán' },
    { value: 'sold_out', label: 'Hết vé' },
    { value: 'finished', label: 'Đã kết thúc' },
    { value: 'cancelled', label: 'Đã hủy' },
]

const SORT_OPTIONS = [
    { value: 'default', label: 'Mặc định' },
    { value: 'date_asc', label: 'Ngày gần nhất' },
    { value: 'date_desc', label: 'Ngày xa nhất' },
    { value: 'price_asc', label: 'Giá thấp nhất' },
    { value: 'price_desc', label: 'Giá cao nhất' },
]

// ─── FilterPill ──────────────────────────────────────────────────────────────
function FilterPill({ value, label, active, count, isDark, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${active
                ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
        >
            {label}
            {count != null && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${active
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {count}
                </span>
            )}
        </button>
    )
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
function EmptyState({ isDark, query, onReset }) {
    return (
        <div className={`flex flex-col items-center justify-center rounded-2xl border py-24 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
            }`}>
            <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
                </svg>
            </div>
            <p className={`text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {query ? `Không tìm thấy kết quả cho "${query}"` : 'Không có sự kiện nào'}
            </p>
            <p className={`mt-1.5 max-w-xs text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Thử thay đổi từ khóa hoặc bỏ bớt bộ lọc đang áp dụng.
            </p>
            <button
                type="button"
                onClick={onReset}
                className="mt-6 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
                Xóa bộ lọc
            </button>
        </div>
    )
}

// ─── Search page ─────────────────────────────────────────────────────────────
function Search() {
    const { isDark } = useTheme()
    const [searchParams, setSearchParams] = useSearchParams()
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('all')
    const [sort, setSort] = useState('default')

    const query = (searchParams.get('q') ?? '').trim()

    useEffect(() => {
        setLoading(true)
        eventsApi.list()
            .then(setEvents)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    // Events matching only the text query (no status filter) - used for pill counts
    const queryMatchedEvents = useMemo(() => {
        const q = query.toLowerCase()
        if (!q) return events
        return events.filter(ev =>
            [ev.title, ev.artist, ev.venue_name].some(f => f?.toLowerCase().includes(q))
        )
    }, [events, query])

    const countByStatus = useMemo(() => {
        const map = { all: queryMatchedEvents.length }
        queryMatchedEvents.forEach(ev => { map[ev.status] = (map[ev.status] ?? 0) + 1 })
        return map
    }, [queryMatchedEvents])

    const filteredEvents = useMemo(() => {
        let result = queryMatchedEvents.filter(ev => {
            return status === 'all' || ev.status === status
        })

        switch (sort) {
            case 'date_asc':
                result = [...result].sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
                break
            case 'date_desc':
                result = [...result].sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
                break
            case 'price_asc':
                result = [...result].sort((a, b) => (a.min_price ?? 0) - (b.min_price ?? 0))
                break
            case 'price_desc':
                result = [...result].sort((a, b) => (b.min_price ?? 0) - (a.min_price ?? 0))
                break
        }
        return result
    }, [queryMatchedEvents, status, sort])

    const handleReset = () => {
        setStatus('all')
        setSort('default')
        setSearchParams({})
    }

    const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
    const cardBg = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
    const inputBg = isDark ? 'border-slate-700 bg-slate-800 text-slate-50' : 'border-slate-200 bg-white text-slate-900'

    return (
        <div className={`min-h-screen ${bg}`}>
            <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">

                {/* ── Page header ── */}
                <div className="mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                            {query ? (
                                <>
                                    Kết quả cho{' '}
                                    <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                                        "{query}"
                                    </span>
                                </>
                            ) : 'Tất cả sự kiện'}
                        </h1>
                        {!loading && (
                            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {filteredEvents.length} sự kiện{query ? ` phù hợp với "${query}"` : ''}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className={`mb-6 flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${cardBg}`}>
                    {/* Status pills */}
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(({ value, label }) => (
                            <FilterPill
                                key={value}
                                value={value}
                                label={label}
                                active={status === value}
                                count={countByStatus[value] ?? 0}
                                isDark={isDark}
                                onClick={setStatus}
                            />
                        ))}
                    </div>

                    {/* Sort select */}
                    <div className="flex shrink-0 items-center gap-2">
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sắp xếp:</span>
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className={`rounded-xl border px-3 py-1.5 text-sm outline-none transition ${inputBg} ${isDark ? 'border-slate-700 focus:border-sky-600' : 'border-slate-200 focus:border-sky-400'
                                }`}
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── Grid ── */}
                {loading ? (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)}
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <EmptyState isDark={isDark} query={query} onReset={handleReset} />
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredEvents.map(ev => (
                            <EventCard key={ev.id} event={ev} isDark={isDark} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Search