import { useQueue } from '../context/QueueContext'

/**
 * Debug component để hiển thị queue status
 * Chỉ hiển thị khi in development mode
 */
export function QueueDebugPanel() {
  const { activeUsers, userPosition, shouldQueue, isAdmitted, isInQueue, CAPACITY_CONFIG } = useQueue()

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-700 shadow-xl backdrop-blur">
      <div className="space-y-1 font-mono">
        <div>Active users: <span className="font-semibold text-sky-700">{activeUsers}</span>/{CAPACITY_CONFIG.NORMAL_CAPACITY}</div>
        <div>Threshold: <span className="font-semibold text-sky-700">{CAPACITY_CONFIG.WARNING_THRESHOLD}</span></div>
        <div>Should queue: <span className={shouldQueue ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-600'}>{shouldQueue ? 'YES ⚠️' : 'NO ✓'}</span></div>
        <div>Position: <span className="font-semibold text-sky-700">{userPosition || 'Not queued'}</span></div>
        <div>Admitted: <span className={isAdmitted ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>{isAdmitted ? 'YES ✓' : 'NO'}</span></div>
        <div>In queue: <span className={isInQueue ? 'font-semibold text-amber-600' : 'font-semibold text-slate-500'}>{isInQueue ? 'YES' : 'NO'}</span></div>
      </div>
    </div>
  )
}
