'use client'
import { useState, useRef } from 'react'
import { COMPANIES, DEFAULT_COMPANY_ID, companyInfo } from './companies'

const MONTHS = {
  January:0, February:1, March:2, April:3, May:4, June:5,
  July:6, August:7, September:8, October:9, November:10, December:11
}

function parseEventDate(dateStr) {
  const parts = (dateStr || '').trim().split(' ')
  if (parts.length !== 3) return null
  const idx = MONTHS[parts[1]]
  if (idx === undefined) return null
  return new Date(parseInt(parts[2]), idx, parseInt(parts[0]))
}

function isPastDate(dateStr) {
  const d = parseEventDate(dateStr)
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

function formatDateWithDay(dateStr) {
  if (!dateStr) return dateStr
  const parts = dateStr.trim().split(' ')
  if (parts.length !== 3) return dateStr
  const [day, month, year] = parts
  const monthIndex = MONTHS[month]
  if (monthIndex === undefined) return dateStr
  const date = new Date(Date.UTC(parseInt(year), monthIndex, parseInt(day)))
  const dayName = date.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Europe/London' })
  return `${dayName} ${dateStr}`
}

export default function Home() {
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloadingLast, setDownloadingLast] = useState(false)
  const [result, setResult] = useState(null)
  const [changes, setChanges] = useState([])
  const [selectedDays, setSelectedDays] = useState([])
  const [error, setError] = useState('')
  const [company, setCompany] = useState(DEFAULT_COMPANY_ID)
  const fileRef = useRef(null)

  async function processFile(file) {
    setUploading(true)
    setError('')
    setChanges([])
    setSelectedDays([])
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('company', company)
      const res = await fetch('/api/process-beo', { method: 'POST', body: formData })
      const text = await res.text()
      let json
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error(`API returned invalid response. First 200 chars: ${text.substring(0, 200)}`)
      }
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      const { days, changes: detected } = json.data
      const futureDays = (days || []).filter(d => !isPastDate(d.date))
      setChanges(detected || [])
      setResult({ days: futureDays })
      setSelectedDays(futureDays.map(d => d.date))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    processFile(file)
    e.target.value = ''
  }


  function toggleDay(date) {
    setSelectedDays(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  function selectAll() {
    setSelectedDays(result.days.map(d => d.date))
  }

  function selectNone() {
    setSelectedDays([])
  }

  async function downloadSelected() {
    if (selectedDays.length === 0) return
    setGenerating(true)
    try {
      const daysToDownload = result.days.filter(d => selectedDays.includes(d.date))
      const res = await fetch('/api/generate-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { days: daysToDownload, changes, beoId: result.beoId } })
      })
      if (!res.ok) throw new Error('Failed to generate sheets')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const firstName = daysToDownload[0]?.date?.replace(/ /g, '_') || 'sheets'
      const lastName = daysToDownload[daysToDownload.length - 1]?.date?.replace(/ /g, '_') || ''
      a.download = `PlateUp_${firstName}_to_${lastName}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function downloadLastReport() {
    setDownloadingLast(true)
    setError('')
    try {
      const res = await fetch('/api/download-last-report', { method: 'GET' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to download')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+?)"/)?.[1] || 'PlateUp_Latest.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloadingLast(false)
    }
  }

  const busy = uploading || generating || downloadingLast

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; min-height: 100vh; font-family: 'DM Sans', sans-serif; }

        .header {
          background: rgba(13,20,40,0.95);
          border-bottom: 1px solid rgba(148,180,255,0.08);
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
        }
        .header-brand {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          color: rgba(200,216,255,0.5);
          letter-spacing: 0.05em;
        }
        .nav { display: flex; align-items: center; gap: 8px; }
        .nav-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 20px;
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em;
          text-transform: uppercase; border: 1px solid rgba(148,180,255,0.1);
          color: rgba(148,180,255,0.45);
        }
        .nav-pill.kitchen { border-color: rgba(74,144,226,0.25); color: rgba(100,180,255,0.7); }
        .nav-pill.hospitality { border-color: rgba(74,201,176,0.25); color: rgba(74,201,176,0.7); }
        .dot { width: 5px; height: 5px; border-radius: 50%; }
        .dot.blue { background: #4a90e2; }
        .dot.teal { background: #4ac9b0; }

        .hero {
          padding: 80px 40px 60px; max-width: 900px;
          margin: 0 auto; text-align: center;
        }
        .hero-logo { display: flex; flex-direction: column; align-items: center; margin-bottom: 40px; }
        .hero-logo-icon { font-size: 72px; margin-bottom: 20px; filter: drop-shadow(0 0 40px rgba(74,144,226,0.5)); }
        .hero-logo-name {
          font-family: 'Playfair Display', serif; font-size: 80px;
          color: #e8eeff; letter-spacing: -0.02em; line-height: 1; margin-bottom: 20px;
        }
        .hero-logo-tagline {
          font-size: 13px; color: rgba(74,201,176,0.75);
          letter-spacing: 0.25em; text-transform: uppercase; font-weight: 400;
        }
        .hero p {
          font-size: 15px; color: rgba(148,180,255,0.45);
          font-weight: 300; line-height: 1.8; max-width: 500px; margin: 0 auto;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(148,180,255,0.08), transparent);
          margin: 0 40px;
        }

        .upload-area { max-width: 760px; margin: 0 auto; padding: 48px 40px 80px; }

        .company-select { margin-bottom: 18px; }
        .company-label {
          font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(148,180,255,0.35); font-weight: 500; margin-bottom: 10px;
        }
        .company-options { display: flex; gap: 10px; }
        .company-chip {
          flex: 1; padding: 12px 16px; border-radius: 10px;
          border: 1px solid rgba(148,180,255,0.1); background: rgba(255,255,255,0.02);
          color: rgba(148,180,255,0.5); font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease; text-align: center;
        }
        .company-chip:hover { border-color: rgba(148,180,255,0.22); }
        .company-chip.active {
          border-color: rgba(74,144,226,0.5); background: rgba(74,144,226,0.08); color: #c8d8ff;
        }
        .company-chip:disabled { opacity: 0.4; cursor: not-allowed; }

        .event-company {
          font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(148,180,255,0.4); background: rgba(148,180,255,0.07);
          padding: 1px 6px; border-radius: 4px;
        }

        .upload-btn {
          width: 100%; position: relative; padding: 28px 24px;
          border-radius: 16px; border: 1px solid rgba(148,180,255,0.1);
          background: rgba(255,255,255,0.02); cursor: pointer;
          transition: all 0.2s ease; text-align: left; overflow: hidden;
          margin-bottom: 28px;
        }
        .upload-btn:hover {
          border-color: rgba(148,180,255,0.22);
          background: rgba(255,255,255,0.035); transform: translateY(-2px);
        }
        .upload-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .btn-label {
          font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(148,180,255,0.35); font-weight: 500; margin-bottom: 8px;
        }
        .btn-main-text { font-size: 15px; font-weight: 500; color: #c8d8ff; margin-bottom: 4px; }
        .btn-sub-text { font-size: 12px; color: rgba(148,180,255,0.3); font-weight: 300; }
        .btn-icon {
          position: absolute; right: 22px; top: 50%;
          transform: translateY(-50%); font-size: 26px; opacity: 0.2;
        }

        .error-box {
          padding: 14px 18px; background: rgba(200,50,50,0.08);
          border: 1px solid rgba(200,50,50,0.25); border-radius: 10px;
          color: #ff9999; font-size: 13px; margin-bottom: 20px; line-height: 1.5;
        }

        .changes-panel {
          padding: 20px; background: rgba(192,0,0,0.07);
          border: 1px solid rgba(192,0,0,0.3); border-radius: 14px; margin-bottom: 24px;
        }
        .changes-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .changes-title { font-size: 13px; font-weight: 500; color: #ff8888; letter-spacing: 0.05em; }
        .change-badge {
          padding: 2px 10px; background: rgba(192,0,0,0.25);
          border-radius: 10px; font-size: 11px; color: #ff9999; font-weight: 500;
        }
        .change-item {
          padding: 10px 14px; margin-bottom: 8px;
          background: rgba(255,242,204,0.04); border-radius: 8px;
          border-left: 3px solid rgba(192,0,0,0.5);
        }
        .change-room {
          font-size: 10px; color: rgba(148,180,255,0.4);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px;
        }
        .change-text { font-size: 13px; color: #e8d080; }

        .no-changes {
          padding: 12px 18px; background: rgba(74,201,176,0.06);
          border: 1px solid rgba(74,201,176,0.18); border-radius: 10px;
          color: rgba(74,201,176,0.75); font-size: 13px; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }

        .results-header {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 14px;
        }
        .results-title {
          font-size: 11px; color: rgba(148,180,255,0.35);
          letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500;
        }
        .select-links { display: flex; gap: 12px; }
        .select-link {
          font-size: 11px; color: rgba(148,180,255,0.4);
          cursor: pointer; text-decoration: underline;
          background: none; border: none; font-family: 'DM Sans', sans-serif;
        }
        .select-link:hover { color: rgba(148,180,255,0.7); }

        .day-card {
          margin-bottom: 8px; border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(148,180,255,0.07); cursor: pointer;
          transition: all 0.15s ease;
        }
        .day-card:hover { border-color: rgba(148,180,255,0.18); }
        .day-card.selected { border-color: rgba(74,144,226,0.4); background: rgba(74,144,226,0.04); }
        .day-card.has-changes { border-color: rgba(192,0,0,0.3); }
        .day-card.selected.has-changes { border-color: rgba(192,0,0,0.5); }

        .day-card-header {
          padding: 14px 20px; background: rgba(255,255,255,0.025);
          display: flex; justify-content: space-between; align-items: center;
        }
        .day-card.selected .day-card-header { background: rgba(74,144,226,0.06); }
        .day-card.has-changes .day-card-header { background: rgba(192,0,0,0.07); }

        .day-left { display: flex; align-items: center; gap: 14px; }
        .day-checkbox {
          width: 18px; height: 18px; border-radius: 5px;
          border: 2px solid rgba(148,180,255,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s;
        }
        .day-card.selected .day-checkbox {
          background: #4a90e2; border-color: #4a90e2;
        }
        .day-checkbox-tick { color: white; font-size: 11px; }

        .day-name { font-size: 14px; font-weight: 500; color: #c8d8ff; }
        .day-meta { font-size: 11px; color: rgba(148,180,255,0.3); margin-top: 2px; }
        .day-meta.changed { color: rgba(255,120,120,0.6); }

        .day-events { padding: 10px 20px; background: rgba(0,0,0,0.2); }
        .event-row {
          display: flex; align-items: center; gap: 10px;
          padding: 5px 0; border-bottom: 1px solid rgba(148,180,255,0.04); font-size: 12px;
        }
        .event-row:last-child { border-bottom: none; }
        .event-beo { font-weight: 600; color: rgba(148,180,255,0.35); font-size: 11px; min-width: 40px; }
        .event-name { color: rgba(200,216,255,0.6); flex: 1; }
        .event-room { color: rgba(74,201,176,0.5); font-size: 11px; }

        .tool-section { max-width: 760px; margin: 0 auto; padding: 48px 40px 80px; }
        .tool-section-title {
          font-size: 11px; color: rgba(148,180,255,0.35);
          letter-spacing: 0.12em; text-transform: uppercase;
          font-weight: 500; margin-bottom: 14px;
        }
        .convert-done {
          padding: 12px 18px; background: rgba(74,201,176,0.06);
          border: 1px solid rgba(74,201,176,0.18); border-radius: 10px;
          color: rgba(74,201,176,0.75); font-size: 13px;
          display: flex; align-items: center; gap: 8px;
        }

        .download-bar {
          position: sticky; bottom: 0;
          background: rgba(10,15,30,0.95); backdrop-filter: blur(12px);
          border-top: 1px solid rgba(148,180,255,0.08);
          padding: 16px 40px; display: flex;
          justify-content: space-between; align-items: center;
        }
        .download-summary { font-size: 13px; color: rgba(148,180,255,0.4); }
        .download-summary strong { color: #c8d8ff; }
        .download-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 28px;
          background: linear-gradient(135deg, rgba(42,82,152,0.9), rgba(26,102,90,0.9));
          border: 1px solid rgba(74,144,226,0.3); border-radius: 10px;
          color: #c8d8ff; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.05em; transition: opacity 0.2s;
        }
        .download-btn:hover { opacity: 0.85; }
        .download-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <header className="header">
        <div className="header-brand">PlateUp</div>
        <nav className="nav">
          <div className="nav-pill kitchen"><span className="dot blue"></span>Kitchen</div>
        </nav>
      </header>

      <div className="hero">
        <div className="hero-logo">
          <div className="hero-logo-icon">🍽️</div>
          <div className="hero-logo-name">PlateUp</div>
          <div className="hero-logo-tagline">Ready for service.</div>
        </div>
        <p>Upload your BEO, select the dates you need, and download print-ready Kitchen production sheets.</p>
      </div>

      <div className="divider" />

      <div className="upload-area">
        <button className="upload-btn" onClick={downloadLastReport} disabled={busy} style={{ marginBottom: '14px' }}>
          <div className="btn-label">{downloadingLast ? '⏳ Downloading...' : 'Quick Download'}</div>
          <div className="btn-main-text">{downloadingLast ? 'Fetching last report...' : 'Download Last Report'}</div>
          <div className="btn-sub-text">Instantly download the latest report without re-uploading files</div>
          <span className="btn-icon">⬇️</span>
        </button>

        <div className="divider" style={{ margin: '28px 0' }} />

        <div className="company-select">
          <div className="company-label">Which company is this order from?</div>
          <div className="company-options">
            {COMPANIES.map(c => (
              <button
                key={c.id}
                className={`company-chip ${company === c.id ? 'active' : ''}`}
                onClick={() => setCompany(c.id)}
                disabled={busy}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.md,.markdown,.txt,.xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button className="upload-btn" onClick={() => fileRef.current.click()} disabled={busy}>
          <div className="btn-label">{uploading ? '⏳ Processing file...' : 'Upload BEO'}</div>
          <div className="btn-main-text">{uploading ? 'Extracting events, please wait...' : 'Upload BEO PDF, Excel or Markdown'}</div>
          <div className="btn-sub-text">Drop in a PDF, Excel (.xlsx) or converted .md — all dates extracted automatically</div>
          <span className="btn-icon">📄</span>
        </button>

        {error && <div className="error-box">❌ {error}</div>}

        {changes.length > 0 && (
          <div className="changes-panel">
            <div className="changes-header">
              <div className="changes-title">⚠ Changes Detected</div>
              <div className="change-badge">{changes.length} change{changes.length !== 1 ? 's' : ''}</div>
            </div>
            {changes.map((c, i) => (
              <div key={i} className="change-item">
                <div className="change-room">{formatDateWithDay(c.day)} — {c.room}</div>
                <div className="change-text">{c.change}</div>
              </div>
            ))}
          </div>
        )}

        {changes.length === 0 && result && (
          <div className="no-changes">✓ No changes detected — sheets are current</div>
        )}

        {result && result.days && (
          <>
            <div className="results-header">
              <div className="results-title">
                {result.days.length} day{result.days.length !== 1 ? 's' : ''} found — select to include in download
              </div>
              <div className="select-links">
                <button className="select-link" onClick={selectAll}>Select all</button>
                <button className="select-link" onClick={selectNone}>Clear</button>
              </div>
            </div>

            {result.days.map((day, i) => {
              const dayChanges = changes.filter(c => c.day === day.date)
              const hasChanges = dayChanges.length > 0
              const isSelected = selectedDays.includes(day.date)
              return (
                <div
                  key={i}
                  className={`day-card ${isSelected ? 'selected' : ''} ${hasChanges ? 'has-changes' : ''}`}
                  onClick={() => toggleDay(day.date)}
                >
                  <div className="day-card-header">
                    <div className="day-left">
                      <div className="day-checkbox">
                        {isSelected && <span className="day-checkbox-tick">✓</span>}
                      </div>
                      <div>
                        <div className="day-name">{hasChanges ? '⚠ ' : ''}{formatDateWithDay(day.date)}</div>
                        <div className={`day-meta ${hasChanges ? 'changed' : ''}`}>
                          {day.events?.length || 0} event{day.events?.length !== 1 ? 's' : ''}
                          {hasChanges ? ` · ${dayChanges.length} change${dayChanges.length !== 1 ? 's' : ''}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="day-events">
                    {day.events?.map((ev, j) => (
                      <div key={j} className="event-row">
                        <span className="event-beo">{ev.beoNumber}</span>
                        <span className="event-name">{ev.eventName}</span>
                        <span className="event-company">{companyInfo(ev.company)?.short}</span>
                        <span className="event-room">{ev.room}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <div className="divider" />


      {result && result.days && (
        <div className="download-bar">
          <div className="download-summary">
            <strong>{selectedDays.length}</strong> of {result.days.length} days selected
          </div>
          <button
            className="download-btn"
            onClick={downloadSelected}
            disabled={busy || selectedDays.length === 0}
          >
            {generating ? '⏳ Generating...' : `↓ Download ${selectedDays.length} Day${selectedDays.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </>
  )
}
