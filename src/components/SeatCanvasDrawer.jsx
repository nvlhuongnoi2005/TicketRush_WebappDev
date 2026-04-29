import { useEffect, useRef, useState } from 'react'
import { FaUndo, FaTrash } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'

const GRID_SIZE = 20
const SEAT_RADIUS = 6

function SeatCanvasDrawer({ onSectionsGenerated }) {
  const canvasRef = useRef(null)
  const { isDark } = useTheme()
  const [seats, setSeats] = useState([])
  const [selectedColor, setSelectedColor] = useState('#22c55e')
  const [mode, setMode] = useState('draw') // 'draw' or 'erase'
  const [gridEnabled, setGridEnabled] = useState(true)

  const colors = [
    { name: 'Green', hex: '#22c55e' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Yellow', hex: '#eab308' },
  ]

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    drawCanvas()
  }, [seats, gridEnabled, isDark, selectedColor])

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
    if (gridEnabled) {
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 0.5
      for (let x = 0; x < canvas.width; x += GRID_SIZE) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += GRID_SIZE) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Draw seats
    seats.forEach((seat) => {
      ctx.fillStyle = seat.color
      ctx.beginPath()
      ctx.arc(seat.x, seat.y, SEAT_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Draw instruction text
    ctx.fillStyle = textColor
    ctx.font = '12px sans-serif'
    ctx.fillText(`Canvas: ${canvas.width}×${canvas.height}px | Seats: ${seats.length}`, 10, canvas.height - 5)
  }

  const getSnappedCoords = (x, y) => {
    if (gridEnabled) {
      return {
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE,
      }
    }
    return { x, y }
  }

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const snapped = getSnappedCoords(x, y)

    if (mode === 'draw') {
      // Check if seat already exists at this location
      const exists = seats.some((s) => Math.abs(s.x - snapped.x) < 5 && Math.abs(s.y - snapped.y) < 5)
      if (!exists) {
        setSeats([...seats, { x: snapped.x, y: snapped.y, color: selectedColor, id: Date.now() + Math.random() }])
      }
    } else if (mode === 'erase') {
      setSeats(seats.filter((s) => !(Math.abs(s.x - snapped.x) < 10 && Math.abs(s.y - snapped.y) < 10)))
    }
  }

  const generateSections = () => {
    if (seats.length === 0) return

    // Group seats by color
    const seatsByColor = {}
    seats.forEach((seat) => {
      if (!seatsByColor[seat.color]) {
        seatsByColor[seat.color] = []
      }
      seatsByColor[seat.color].push(seat)
    })

    // Generate sections
    const sections = Object.entries(seatsByColor).map(([color, colorSeats]) => {
      const minX = Math.min(...colorSeats.map((s) => s.x))
      const maxX = Math.max(...colorSeats.map((s) => s.x))
      const minY = Math.min(...colorSeats.map((s) => s.y))
      const maxY = Math.max(...colorSeats.map((s) => s.y))

      const rows = Math.round((maxY - minY) / GRID_SIZE) + 1
      const cols = Math.round((maxX - minX) / GRID_SIZE) + 1
      const totalSeats = colorSeats.length

      return {
        name: colors.find((c) => c.hex === color)?.name || 'Section',
        rows: Math.max(1, rows),
        cols: Math.max(1, cols),
        price: 500000,
        color: color,
        available_seats: totalSeats,
        total_seats: totalSeats,
        id: Date.now() + Math.random(),
      }
    })

    onSectionsGenerated(sections)
  }

  const clearCanvas = () => {
    setSeats([])
  }

  const undo = () => {
    setSeats(seats.slice(0, -1))
  }

  return (
    <div className={`rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Canvas Seat Designer</h2>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Click on the canvas to place seats. Select a section color first, then click to draw seats on the grid.
        </p>
      </div>

      <div className="mb-4 grid gap-3">
        {/* Color selection */}
        <div>
          <label className="mb-2 block text-sm font-semibold">Section Color</label>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => (
              <button
                key={color.hex}
                onClick={() => setSelectedColor(color.hex)}
                className={`w-12 h-12 rounded-lg border-2 transition ${
                  selectedColor === color.hex
                    ? 'border-slate-400 shadow-lg'
                    : isDark
                      ? 'border-slate-600'
                      : 'border-slate-300'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Mode selection */}
        <div>
          <label className="mb-2 block text-sm font-semibold">Drawing Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('draw')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === 'draw'
                  ? 'bg-sky-500 text-white'
                  : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              🖌 Draw
            </button>
            <button
              onClick={() => setMode('erase')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === 'erase'
                  ? 'bg-rose-500 text-white'
                  : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              ✕ Erase
            </button>
          </div>
        </div>

        {/* Grid toggle */}
        <label className={`flex items-center gap-2 rounded-lg p-3 cursor-pointer ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}>
          <input
            type="checkbox"
            checked={gridEnabled}
            onChange={(e) => setGridEnabled(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show grid (helps alignment)</span>
        </label>
      </div>

      {/* Canvas */}
      <div className={`mb-4 rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-crosshair"
          style={{ minHeight: '300px', display: 'block' }}
        />
      </div>

      {/* Info and actions */}
      <div className={`mb-4 p-3 rounded-lg text-sm ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
        <p>Total seats placed: <strong>{seats.length}</strong></p>
        <p>Selected color: <span style={{ color: selectedColor, fontWeight: 'bold' }}>■</span></p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={undo}
          disabled={seats.length === 0}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600"
        >
          <FaUndo /> Undo
        </button>
        <button
          onClick={clearCanvas}
          disabled={seats.length === 0}
          className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-600"
        >
          <FaTrash /> Clear all
        </button>
        <button
          onClick={generateSections}
          disabled={seats.length === 0}
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600"
        >
          Generate sections from canvas
        </button>
      </div>
    </div>
  )
}

export default SeatCanvasDrawer
