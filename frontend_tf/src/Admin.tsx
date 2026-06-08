import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

type Registration = {
  id: string
  name: string
  surname: string
  email: string
  registeredAt?: { seconds: number }
}

type EventConfig = {
  date: string
  time: string
  location: string
  mapsUrl: string
  helperMessage: string
}

const DEFAULT_CONFIG: EventConfig = {
  date: '',
  time: '',
  location: '',
  mapsUrl: '',
  helperMessage: '',
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === 'true')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<EventConfig>(DEFAULT_CONFIG)
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  const [configError, setConfigError] = useState('')
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deleteAllConfirmed, setDeleteAllConfirmed] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', 'true')
      setAuthed(true)
    } else {
      setError(true)
    }
  }

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    getDocs(query(collection(db, 'registrations'), orderBy('registeredAt', 'desc')))
      .then(snap => setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Registration))))
      .finally(() => setLoading(false))

    getDoc(doc(db, 'config', 'event')).then(snap => {
      if (snap.exists()) setConfig(snap.data() as EventConfig)
    })
  }, [authed])

  const handleDelete = async (id: string) => {
    if (!confirm('Obrisati ovu prijavu?')) return
    await deleteDoc(doc(db, 'registrations', id))
    setRegistrations(prev => prev.filter(r => r.id !== id))
  }

  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setConfigSaving(true)
    setConfigError('')
    try {
      await setDoc(doc(db, 'config', 'event'), config)
      setConfigSaved(true)
      setTimeout(() => setConfigSaved(false), 2000)
    } catch (err) {
      setConfigError('Greška pri spremanju. Provjeri pravila baze podataka.')
    } finally {
      setConfigSaving(false)
    }
  }

  const handleResetConfig = async () => {
    setConfigSaving(true)
    setConfigError('')
    try {
      await setDoc(doc(db, 'config', 'event'), DEFAULT_CONFIG)
      setConfig(DEFAULT_CONFIG)
      setConfigSaved(true)
      setTimeout(() => setConfigSaved(false), 2000)
    } catch {
      setConfigError('Greška pri spremanju. Provjeri pravila baze podataka.')
    } finally {
      setConfigSaving(false)
    }
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    try {
      await Promise.all(registrations.map(r => deleteDoc(doc(db, 'registrations', r.id))))
      setRegistrations([])
    } finally {
      setDeletingAll(false)
      setDeleteAllOpen(false)
      setDeleteAllConfirmed(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Ime', 'Prezime', 'Email', 'Datum prijave'],
      ...registrations.map(r => [
        r.name,
        r.surname,
        r.email,
        r.registeredAt ? new Date(r.registeredAt.seconds * 1000).toLocaleString('hr') : '',
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prijave.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 flex flex-col gap-4">
          <h1 className="text-white text-xl font-bold text-center">Admin</h1>
          <input
            type="password"
            placeholder="Lozinka"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            className="bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {error && <p className="text-red-400 text-sm text-center">Pogrešna lozinka</p>}
          <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold py-2.5 rounded-lg transition-colors">
            Prijava
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">

        {/* Event config */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-white text-lg font-bold mb-4">Postavke događaja</h2>
          <form onSubmit={handleConfigSave} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-gray-400 text-xs">Datum</label>
                <input
                  type="date"
                  value={config.date}
                  onChange={e => setConfig(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-gray-400 text-xs">Vrijeme</label>
                <input
                  type="time"
                  value={config.time}
                  onChange={e => setConfig(prev => ({ ...prev, time: e.target.value }))}
                  className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
            {(['location', 'mapsUrl'] as const).map(key => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">{key === 'location' ? 'Lokacija' : 'Google Maps URL'}</label>
                <input
                  value={config[key]}
                  onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
                  className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">Poruka</label>
              <textarea
                value={config.helperMessage}
                onChange={e => setConfig(prev => ({ ...prev, helperMessage: e.target.value }))}
                rows={3}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={configSaving}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                {configSaved ? 'Spremljeno ✓' : configSaving ? 'Spremanje...' : 'Spremi'}
              </button>
              <button
                type="button"
                disabled={configSaving}
                onClick={handleResetConfig}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Nema aktivnih događaja
              </button>
            </div>
            {configError && <p className="text-red-400 text-sm text-center">{configError}</p>}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide">Pregled</p>
            <div className="bg-gray-800/60 rounded-xl p-4">
              <p className="text-white font-bold text-lg mb-1">Prijava na događaj</p>
              {!config.date ? (
                <p className="text-gray-400 text-sm">Trenutno nema aktivnih događaja.</p>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-3">
                    Dolaziš li na događaj{' '}
                    <span className="text-amber-400 font-medium">
                      {new Date(config.date + 'T00:00:00').toLocaleDateString('hr', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                    </span>{' '}u{' '}
                    <span className="text-amber-400 font-medium">{config.time || '--:--'}</span> sati na lokaciji{' '}
                    <span className="text-amber-400 font-medium underline underline-offset-2">
                      {config.location || 'N/A'}
                    </span>?
                  </p>
                  {config.helperMessage && (
                    <p className="text-gray-500 text-xs italic">{config.helperMessage}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Registrations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-xl font-bold">Prijavljeni ({registrations.length})</h1>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Izvezi CSV
              </button>
              <button
                onClick={() => { setDeleteAllOpen(true); setDeleteAllConfirmed(false) }}
                className="bg-red-700 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Obriši sve
              </button>
            </div>
          </div>

          {deleteAllOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
                <h2 className="text-white font-bold text-lg">Obriši sve prijave?</h2>
                <p className="text-gray-400 text-sm">Ova radnja je nepovratna. Svih {registrations.length} prijava bit će trajno obrisano.</p>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deleteAllConfirmed}
                    onChange={e => setDeleteAllConfirmed(e.target.checked)}
                    className="w-4 h-4 accent-red-500"
                  />
                  <span className="text-gray-300 text-sm">Da, želim obrisati sve prijave</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteAllOpen(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 rounded-lg text-sm transition-colors"
                  >
                    Odustani
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    disabled={!deleteAllConfirmed || deletingAll}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                  >
                    {deletingAll ? 'Brisanje...' : 'Obriši sve'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-gray-400 text-center">Učitavanje...</p>
          ) : (
            <div className="bg-gray-900 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Ime</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Prezime</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Datum</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(r => (
                    <tr key={r.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                      <td className="text-white px-4 py-3">{r.name}</td>
                      <td className="text-white px-4 py-3">{r.surname}</td>
                      <td className="text-gray-300 px-4 py-3">{r.email}</td>
                      <td className="text-gray-400 px-4 py-3">
                        {r.registeredAt ? new Date(r.registeredAt.seconds * 1000).toLocaleString('hr') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-red-500 hover:text-red-400 text-xs font-medium transition-colors"
                        >
                          Obriši
                        </button>
                      </td>
                    </tr>
                  ))}
                  {registrations.length === 0 && (
                    <tr><td colSpan={5} className="text-gray-400 text-center px-4 py-8">Nema prijava</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
