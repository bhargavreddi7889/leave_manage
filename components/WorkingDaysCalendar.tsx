'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface DayData {
  date: string
  is_working_day: boolean
  day_type: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'SPECIAL_WORKING'
  note: string | null
}

interface EditModal {
  date: string
  isWorkingDay: boolean
  note: string
  dayType: string
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function dayColor(d: DayData | undefined, dateStr: string): string {
  if (!d) {
    const dow = new Date(dateStr).getDay()
    return dow === 0 || dow === 6 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-indigo-50 cursor-pointer'
  }
  if (!d.is_working_day && d.day_type === 'HOLIDAY')
    return 'bg-red-100 text-red-700 border border-red-200 cursor-pointer hover:bg-red-200'
  if (!d.is_working_day)
    return 'bg-gray-100 text-gray-400 cursor-pointer hover:bg-gray-200'
  if (d.day_type === 'SPECIAL_WORKING')
    return 'bg-orange-100 text-orange-700 border border-orange-200 cursor-pointer hover:bg-orange-200'
  return 'bg-green-50 text-gray-800 cursor-pointer hover:bg-indigo-50'
}

export default function WorkingDaysCalendar() {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [days,  setDays]  = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<EditModal | null>(null)
  const [saving, setSaving] = useState(false)
  const [initYear, setInitYear] = useState(today.getFullYear())
  const [initing, setIniting] = useState(false)

  const fetchDays = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/working-days?year=${year}&month=${month}`)
      const d = await r.json()
      if (r.ok) setDays(d)
      else toast.error(d.error || 'Failed to load calendar')
    } catch {
      toast.error('Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchDays() }, [fetchDays])

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayMap = new Map(days.map(d => [d.date, d]))

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const dd = i + 1
      return `${year}-${String(month).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    }),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const openModal = (dateStr: string) => {
    const d = dayMap.get(dateStr)
    const dow = new Date(dateStr).getDay()
    setModal({
      date: dateStr,
      isWorkingDay: d ? d.is_working_day : !(dow === 0 || dow === 6),
      note: d?.note || '',
      dayType: d?.day_type || (dow === 0 || dow === 6 ? 'WEEKEND' : 'WEEKDAY'),
    })
  }

  const handleSave = async () => {
    if (!modal) return
    setSaving(true)
    try {
      const r = await fetch(`/api/admin/working-days/${modal.date}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWorkingDay: modal.isWorkingDay, note: modal.note }),
      })
      const result = await r.json()
      if (r.ok) {
        toast.success('Day updated!')
        setModal(null)
        fetchDays()
      } else {
        toast.error(result.error || 'Failed to update')
      }
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleInitYear = async () => {
    setIniting(true)
    try {
      const r = await fetch('/api/admin/working-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: initYear }),
      })
      const result = await r.json()
      if (r.ok) {
        toast.success(result.message)
        fetchDays()
      } else {
        toast.error(result.error || 'Failed to initialise year')
      }
    } catch {
      toast.error('Failed to initialise year')
    } finally {
      setIniting(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // Stats
  const workingCount  = days.filter(d => d.is_working_day).length
  const holidayCount  = days.filter(d => !d.is_working_day && d.day_type === 'HOLIDAY').length
  const weekendCount  = days.filter(d => d.day_type === 'WEEKEND').length
  const specialCount  = days.filter(d => d.day_type === 'SPECIAL_WORKING').length

  return (
    <div className="space-y-6">
      {/* Init year panel */}
      <div className="card bg-indigo-50 border border-indigo-200">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-800">Initialise a year</p>
            <p className="text-xs text-indigo-600">Inserts all days for the year with weekdays as working and weekends as non-working. Existing entries are untouched.</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="number" value={initYear} min={2020} max={2040}
              onChange={e => setInitYear(parseInt(e.target.value))}
              className="w-24 px-2 py-1 border border-indigo-300 rounded text-sm"
            />
            <button onClick={handleInitYear} disabled={initing}
              className="btn-primary flex items-center gap-1 text-sm py-1.5 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${initing ? 'animate-spin' : ''}`} />
              {initing ? 'Initialising...' : 'Initialise'}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{MONTH_NAMES[month - 1]} {year}</h2>
            <div className="flex gap-4 mt-1 text-xs text-gray-500 justify-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" />Working: {workingCount}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" />Weekend: {weekendCount}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" />Holidays: {holidayCount}</span>
              {specialCount > 0 && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 inline-block" />Special: {specialCount}</span>}
            </div>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_LABELS.map(l => (
            <div key={l} className={`text-center text-xs font-semibold py-1 ${l === 'Sun' || l === 'Sat' ? 'text-gray-400' : 'text-gray-600'}`}>{l}</div>
          ))}
        </div>

        {/* Day cells */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading calendar...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={i} />
              const d = dayMap.get(dateStr)
              const dd = parseInt(dateStr.split('-')[2])
              const isToday = dateStr === today.toISOString().split('T')[0]
              return (
                <div
                  key={dateStr}
                  onClick={() => openModal(dateStr)}
                  className={`relative min-h-[64px] rounded-lg p-1.5 text-sm transition-all ${dayColor(d, dateStr)} ${isToday ? 'ring-2 ring-indigo-400' : ''}`}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-indigo-700' : ''}`}>{dd}</div>
                  {d?.day_type === 'HOLIDAY' && (
                    <div className="text-[10px] font-medium text-red-600 leading-tight">🏖️ Holiday</div>
                  )}
                  {d?.day_type === 'SPECIAL_WORKING' && (
                    <div className="text-[10px] font-medium text-orange-600 leading-tight">⚡ Working</div>
                  )}
                  {d?.note && (
                    <div className="text-[9px] text-gray-500 truncate leading-tight" title={d.note}>{d.note}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" />Working Day</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" />Weekend (non-working)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />Holiday (non-working)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-200 inline-block" />Special Working (weekend override)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-2 ring-indigo-400 inline-block" />Today</span>
        </div>
      </div>

      {/* Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {new Date(modal.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>

            {/* Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Working Day</span>
              <button
                onClick={() => setModal(m => m ? { ...m, isWorkingDay: !m.isWorkingDay } : m)}
                className={`relative w-12 h-6 rounded-full transition-colors ${modal.isWorkingDay ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${modal.isWorkingDay ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note / Holiday Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={modal.note}
                onChange={e => setModal(m => m ? { ...m, note: e.target.value } : m)}
                placeholder="e.g. Diwali, Republic Day, Special Working Saturday…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 btn-secondary text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
