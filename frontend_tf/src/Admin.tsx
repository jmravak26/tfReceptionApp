import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

type Registration = {
  id: string
  name: string
  surname: string
  email: string
  registeredAt?: { seconds: number }
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
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
  }, [authed])

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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-xl font-bold">Prijavljeni ({registrations.length})</h1>
          <button
            onClick={exportCSV}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Izvezi CSV
          </button>
        </div>

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
                  </tr>
                ))}
                {registrations.length === 0 && (
                  <tr><td colSpan={4} className="text-gray-400 text-center px-4 py-8">Nema prijava</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
