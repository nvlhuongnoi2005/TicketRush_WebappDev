import { useEffect, useRef, useState } from 'react'
import { FaPlus, FaTrash, FaUndo } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'

const SEAT_RADIUS = 5

function SeatCanvasDrawer({ onSectionsGenerated }) {
  const canvasRef = useRef(null)
  const { isDark } = useTheme()
  const [zones, setZones] = useState([]) // Array of {id, points, name, price, rows, cols, color}
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false)
  const [draftPoints, setDraftPoints] = useState([])
  const [hoverPoint, setHoverPoint] = useState(null)
  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [editingZone, setEditingZone] = useState(null)
  const [isDraggingZone, setIsDraggingZone] = useState(false)
  const [draggedZoneId, setDraggedZoneId] = useState(null)
  const [dragStartPos, setDragStartPos] = useState(null)

  const colors = [
    '#22c55e', // green
    '#3b82f6', // blue
    '#a855f7', // purple
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#06b6d4', // cyan
    '#ec4899', // pink
  ]

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const getPolygonBounds = (points) => {
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    }
  }

  const getPolygonCentroid = (points) => {
    if (!points.length) return { x: 0, y: 0 }

    let area = 0
    let x = 0
    let y = 0

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index]
      const next = points[(index + 1) % points.length]
      const cross = current.x * next.y - next.x * current.y
      area += cross
      x += (current.x + next.x) * cross
      y += (current.y + next.y) * cross
    }

    if (Math.abs(area) < 0.001) {
      const bounds = getPolygonBounds(points)
      return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
    }

    area *= 0.5
    return {
      x: x / (6 * area),
      y: y / (6 * area),
    }
  }

  const isPointInPolygon = (point, points) => {
    let inside = false

    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const xi = points[i].x
      const yi = points[i].y
      const xj = points[j].x
      const yj = points[j].y

      const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.000001) + xi
      if (intersects) inside = !inside
    }

    return inside
  }

  const translatePoints = (points, deltaX, deltaY) => {
    return points.map((point) => ({
      x: Math.max(0, point.x + deltaX),
      y: Math.max(0, point.y + deltaY),
    }))
  }

  const finishPolygon = () => {
    if (draftPoints.length < 3) return

    const newZone = {
      id: Date.now(),
      points: draftPoints,
      name: `Zone ${zones.length + 1}`,
      price: 500000,
      rows: 2,
      cols: 3,
      color: colors[zones.length % colors.length],
      shape: 'polygon',
    }

    setZones([...zones, newZone])
    setSelectedZoneId(newZone.id)
    setEditingZone({ ...newZone })
    setIsDrawingPolygon(false)
    setDraftPoints([])
    setHoverPoint(null)
  }

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    drawCanvas()
  }, [zones, draftPoints, hoverPoint, selectedZoneId, isDark, isDrawingPolygon])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const bgColor = isDark ? '#1e293b' : '#f1f5f9'
    const gridColor = isDark ? '#334155' : '#e2e8f0'
    const textColor = isDark ? '#cbd5e1' : '#64748b'

    // Clear canvas
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 0.5
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    const drawPolygonPath = (ctx, points) => {
      if (!points.length) return

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y))
      ctx.closePath()
    }

    // Draw zones
    zones.forEach((zone) => {
      const isSelected = zone.id === selectedZoneId
      const bounds = getPolygonBounds(zone.points)

      drawPolygonPath(ctx, zone.points)
      ctx.fillStyle = zone.color + '40'
      ctx.fill()

      ctx.strokeStyle = isSelected ? '#00ff00' : zone.color
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()

      const centroid = getPolygonCentroid(zone.points)
      ctx.fillStyle = textColor
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(`${zone.name} | ${zone.rows}×${zone.cols}`, Math.max(8, centroid.x - 50), Math.max(20, centroid.y))

      if (bounds.width < 40 || bounds.height < 40) {
        ctx.strokeStyle = zone.color
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
      }
    })

    if (isDrawingPolygon && draftPoints.length > 0) {
      ctx.strokeStyle = '#00ff00'
      ctx.fillStyle = '#00ff0030'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.moveTo(draftPoints[0].x, draftPoints[0].y)
      draftPoints.slice(1).forEach((point) => ctx.lineTo(point.x, point.y))

      if (hoverPoint) {
        ctx.lineTo(hoverPoint.x, hoverPoint.y)
      }

      ctx.stroke()

      draftPoints.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#00ff00'
        ctx.fill()
      })
    }
  }

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCanvasPoint(e)

    if (isDrawingPolygon) {
      setDraftPoints((prev) => [...prev, { x, y }])
      setHoverPoint({ x, y })
      return
    }

    // Check if clicking on existing zone
    const clickedZone = [...zones].reverse().find((zone) => isPointInPolygon({ x, y }, zone.points))

    if (clickedZone) {
      setSelectedZoneId(clickedZone.id)
      setEditingZone({ ...clickedZone })
      setIsDraggingZone(true)
      setDraggedZoneId(clickedZone.id)
      setDragStartPos({ x, y })
      return
    }

    // Start drawing new zone
    setIsDrawing(true)
    setStartPos({ x, y })
  }

  const handleCanvasMouseMove = (e) => {
    const { x, y } = getCanvasPoint(e)

    if (isDrawingPolygon) {
      setHoverPoint({ x, y })
      return
    }

    // Handle zone dragging
    if (isDraggingZone && draggedZoneId && dragStartPos) {
      const deltaX = x - dragStartPos.x
      const deltaY = y - dragStartPos.y

      setZones(zones.map((zone) => {
        if (zone.id === draggedZoneId) {
          return {
            ...zone,
            points: translatePoints(zone.points, deltaX, deltaY),
          }
        }
        return zone
      }))

      setEditingZone((prev) => {
        if (prev && prev.id === draggedZoneId) {
          return {
            ...prev,
            points: translatePoints(prev.points, deltaX, deltaY),
          }
        }
        return prev
      })

      setDragStartPos({ x, y })
      return
    }
  }

  const handleCanvasMouseUp = (e) => {
    // End zone dragging
    if (isDraggingZone) {
      setIsDraggingZone(false)
      setDraggedZoneId(null)
      setDragStartPos(null)
      return
    }
  }

  const handleCanvasDoubleClick = () => {
    if (isDrawingPolygon) {
      finishPolygon()
    }
  }

  const startFreeformShape = () => {
    setIsDrawingPolygon(true)
    setDraftPoints([])
    setHoverPoint(null)
  }

  const cancelFreeformShape = () => {
    setIsDrawingPolygon(false)
    setDraftPoints([])
    setHoverPoint(null)
  }

  const undoDraftPoint = () => {
    setDraftPoints((prev) => prev.slice(0, -1))
  }

  const generateSeatsFromZones = () => {
    if (zones.length === 0) return

    const sections = zones.map((zone) => {
      const bounds = getPolygonBounds(zone.points)
      const seatWidth = bounds.width / zone.cols
      const seatHeight = bounds.height / zone.rows
      const seats = []

      for (let row = 0; row < zone.rows; row++) {
        for (let col = 0; col < zone.cols; col++) {
          const candidate = {
            x: bounds.x + col * seatWidth + seatWidth / 2,
            y: bounds.y + row * seatHeight + seatHeight / 2,
          }

          if (isPointInPolygon(candidate, zone.points)) {
            seats.push({
              ...candidate,
              color: zone.color,
            })
          }
        }
      }

      if (seats.length === 0) {
        for (let row = 0; row < zone.rows; row += 1) {
          for (let col = 0; col < zone.cols; col += 1) {
            seats.push({
              x: bounds.x + col * seatWidth + seatWidth / 2,
              y: bounds.y + row * seatHeight + seatHeight / 2,
              color: zone.color,
            })
          }
        }
      }

      return {
        name: zone.name,
        rows: zone.rows,
        cols: zone.cols,
        price: zone.price,
        color: zone.color,
        available_seats: seats.length,
        total_seats: seats.length,
        id: zone.id,
        shape: 'polygon',
        points: zone.points,
      }
    })

    onSectionsGenerated(sections)
  }

  const updateEditingZone = (field, value) => {
    setEditingZone((prev) => ({ ...prev, [field]: value }))
  }

  const saveEditingZone = () => {
    if (!editingZone) return
    setZones(zones.map((z) => (z.id === editingZone.id ? editingZone : z)))
    setSelectedZoneId(editingZone.id)
  }

  const deleteZone = (id) => {
    setZones(zones.filter((z) => z.id !== id))
    setSelectedZoneId(null)
    setEditingZone(null)
  }

  const clearAll = () => {
    setZones([])
    setSelectedZoneId(null)
    setEditingZone(null)
    setIsDrawingPolygon(false)
    setDraftPoints([])
    setHoverPoint(null)
  }

  return (
    <div className={`rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Canvas Zone Designer</h2>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Draw freeform zones by clicking points. Double click to finish. Drag zones to move them.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Canvas */}
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseLeave={() => {
              setIsDraggingZone(false)
              setDraggedZoneId(null)
              setDragStartPos(null)
              setHoverPoint(null)
            }}
            className="w-full"
            style={{ minHeight: '400px', display: 'block', cursor: isDraggingZone ? 'grabbing' : isDrawingPolygon ? 'crosshair' : 'default' }}
          />
        </div>

        {/* Zone Editor Panel */}
        <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Zones ({zones.length})</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startFreeformShape}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400"
              >
                <FaPlus /> Start freeform
              </button>
              <button
                type="button"
                onClick={finishPolygon}
                disabled={!isDrawingPolygon || draftPoints.length < 3}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-emerald-400"
              >
                Finish shape
              </button>
              <button
                type="button"
                onClick={undoDraftPoint}
                disabled={!isDrawingPolygon || draftPoints.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-400"
              >
                <FaUndo /> Undo point
              </button>
              <button
                type="button"
                onClick={cancelFreeformShape}
                disabled={!isDrawingPolygon && draftPoints.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-rose-400"
              >
                <FaTrash /> Cancel
              </button>
            </div>
            <p className={`mb-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isDrawingPolygon
                ? 'Click on the canvas to add points, then double click or press Finish shape.'
                : 'Press Start freeform to draw a custom zone shape.'}
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedZoneId(zone.id)
                    setEditingZone({ ...zone })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedZoneId(zone.id)
                      setEditingZone({ ...zone })
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                    selectedZoneId === zone.id
                      ? isDark
                        ? 'bg-sky-600 text-white'
                        : 'bg-sky-200 text-sky-900'
                      : isDark
                        ? 'bg-slate-600 text-slate-50 hover:bg-slate-500'
                        : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="flex-1 truncate">{zone.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${isDark ? 'border-slate-500 text-slate-300' : 'border-slate-300 text-slate-500'}`}>
                      polygon
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteZone(zone.id)
                      }}
                      className="text-xs bg-rose-500 hover:bg-rose-600 text-white px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {editingZone && (
            <div className={`border-t pt-4 ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
              <h4 className="font-semibold mb-3">Edit Zone</h4>
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Zone Name
                  </label>
                  <input
                    type="text"
                    value={editingZone.name}
                    onChange={(e) => updateEditingZone('name', e.target.value)}
                    className={`w-full px-2 py-1 rounded text-sm border ${
                      isDark
                        ? 'border-slate-600 bg-slate-600 text-slate-50'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Price (VND)
                  </label>
                  <input
                    type="number"
                    value={editingZone.price}
                    onChange={(e) => updateEditingZone('price', Number(e.target.value))}
                    className={`w-full px-2 py-1 rounded text-sm border ${
                      isDark
                        ? 'border-slate-600 bg-slate-600 text-slate-50'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Rows
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingZone.rows}
                      onChange={(e) => updateEditingZone('rows', Math.max(1, Number(e.target.value)))}
                      className={`w-full px-2 py-1 rounded text-sm border ${
                        isDark
                          ? 'border-slate-600 bg-slate-600 text-slate-50'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Columns
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingZone.cols}
                      onChange={(e) => updateEditingZone('cols', Math.max(1, Number(e.target.value)))}
                      className={`w-full px-2 py-1 rounded text-sm border ${
                        isDark
                          ? 'border-slate-600 bg-slate-600 text-slate-50'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <button
                  onClick={saveEditingZone}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 rounded text-sm transition"
                >
                  Save Zone
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info and actions */}
      <div className={`mt-4 p-3 rounded-lg text-sm ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
        <p>Total zones: <strong>{zones.length}</strong> | Total seats: <strong>{zones.reduce((sum, z) => sum + z.rows * z.cols, 0)}</strong></p>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={clearAll}
          disabled={zones.length === 0}
          className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-600"
        >
          <FaTrash /> Clear all
        </button>
        <button
          onClick={generateSeatsFromZones}
          disabled={zones.length === 0}
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600"
        >
          Generate sections from zones
        </button>
      </div>
    </div>
  )
}

export default SeatCanvasDrawer
