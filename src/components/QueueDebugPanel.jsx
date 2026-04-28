import { useQueue } from '../context/QueueContext'

/**
 * Debug component để hiển thị queue status
 * Chỉ hiển thị khi in development mode
 */
export function QueueDebugPanel() {
  const { activeUsers, userPosition, shouldQueue, isAdmitted, isInQueue, CAPACITY_CONFIG } = useQueue()

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs rounded-lg border border-cyan-500/50 bg-slate-900/95 p-3 text-xs text-white shadow-lg">
      <div className="space-y-1 font-mono">
        <div>Active users: <span className="text-cyan-300">{activeUsers}</span>/{CAPACITY_CONFIG.NORMAL_CAPACITY}</div>
        <div>Threshold: <span className="text-cyan-300">{CAPACITY_CONFIG.WARNING_THRESHOLD}</span></div>
        <div>Should queue: <span className={shouldQueue ? 'text-red-400' : 'text-green-400'}>{shouldQueue ? 'YES ⚠️' : 'NO ✓'}</span></div>
        <div>Position: <span className="text-cyan-300">{userPosition || 'Not queued'}</span></div>
        <div>Admitted: <span className={isAdmitted ? 'text-green-400' : 'text-amber-400'}>{isAdmitted ? 'YES ✓' : 'NO'}</span></div>
        <div>In queue: <span className={isInQueue ? 'text-amber-400' : 'text-slate-400'}>{isInQueue ? 'YES' : 'NO'}</span></div>
      </div>
    </div>
  )
}
