import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { setDoc, doc, serverTimestamp, getDoc, getCountFromServer, collection } from 'firebase/firestore'
import { db } from './firebase'

type EventConfig = {
  date: string
  time: string
  location: string
  mapsUrl: string
  helperMessage: string
}

type FormState = { name: string; surname: string; email: string }
type Status = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate'

export default function App() {
  const [form, setForm] = useState<FormState>({ name: '', surname: '', email: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [spinning, setSpinning] = useState(false)
  const [event, setEvent] = useState<EventConfig | null>(null)
  const [signedCount, setSignedCount] = useState<number | null>(null)
  const [configLoading, setConfigLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, 'config', 'event')),
      getCountFromServer(collection(db, 'registrations')),
    ]).then(([configSnap, countSnap]) => {
      if (configSnap.exists()) setEvent(configSnap.data() as EventConfig)
      setSignedCount(countSnap.data().count)
      setConfigLoading(false)
    })
  }, [])

  const handleLogoClick = () => {
    if (spinning) return
    setSpinning(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    try {
      const docRef = doc(db, 'registrations', form.email)
      const existing = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef))
      if (existing.exists()) {
        setStatus('duplicate')
        return
      }
      await setDoc(docRef, { ...form, registeredAt: serverTimestamp() })
      setSignedCount(prev => prev !== null ? prev + 1 : 1)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const hasEvent = Boolean(event?.date)

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/pictures/group_photo.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-gray-900/80 rounded-2xl shadow-xl p-8">
        <Link to="/admin" className="absolute top-4 right-4 text-gray-500 hover:text-amber-400 text-xs transition-colors">
          Admin
        </Link>
        <div className="logo-fade">
          <img
            src="/imagesLogo/logo_tf_bili.png"
            alt="TF Logo"
            className={`h-32 mx-auto mb-6 cursor-pointer select-none animate-float ${spinning ? 'spinning' : ''}`}
            onClick={handleLogoClick}
            onAnimationEnd={(e) => { if (e.animationName === 'spin-twice') setSpinning(false) }}
          />
        </div>

        <h1 className="text-2xl font-bold text-white mb-1 text-center">Prijava na događaj</h1>

        {configLoading ? (
          <p className="text-gray-500 text-sm mt-2 text-center animate-pulse">Učitavanje...</p>
        ) : !hasEvent ? (
          <p className="text-gray-400 text-sm mt-2 text-center">Trenutno nema aktivnih događaja.</p>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-6 sm:whitespace-nowrap whitespace-normal">
              Dolaziš li na događaj{' '}
              <span className="text-amber-400 font-medium">
                {new Date(event!.date + 'T00:00:00').toLocaleDateString('hr', { day: 'numeric', month: 'numeric', year: 'numeric' })}
              </span> u{' '}
              <span className="text-amber-400 font-medium">{event!.time}</span> sati na lokaciji{' '}
              <a
                href={event!.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 font-medium underline underline-offset-2 hover:text-amber-300 transition-colors"
              >
                {event!.location}
              </a>?
            </p>
            {signedCount !== null && (
              <p className="text-gray-400 text-sm mb-4 text-center">
                Do sada prijavljeno: <span className="text-amber-400 font-semibold">{signedCount}</span> {signedCount === 1 ? 'član' : signedCount >= 2 && signedCount <= 4 ? 'člana' : 'članova'}
              </p>
            )}
            {event!.helperMessage && (
              <p className="text-gray-500 text-xs mb-6 italic text-center">{event!.helperMessage}</p>
            )}

            {status === 'success' ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-white font-semibold">Uspješno si prijavljen/a!</p>
                <p className="text-gray-400 text-sm mt-1">Vidimo se, {form.name}!</p>
                {event!.mapsUrl && (
                  <a
                    href={event!.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-amber-400 text-sm font-medium underline underline-offset-2 hover:text-amber-300 transition-colors"
                  >
                    📍 Klikni za lokaciju
                  </a>
                )}
              </div>
            ) : status === 'duplicate' ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">👋</p>
                <p className="text-white font-semibold">Već si prijavljen/a!</p>
                <p className="text-gray-400 text-sm mt-1">Tvoja prijava je već evidentirana, {form.name}.</p>
                {event!.mapsUrl && (
                  <a
                    href={event!.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-amber-400 text-sm font-medium underline underline-offset-2 hover:text-amber-300 transition-colors"
                  >
                    📍 Klikni za lokaciju
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field label="Ime" name="name" value={form.name} onChange={handleChange} />
                <Field label="Prezime" name="surname" value={form.surname} onChange={handleChange} />
                <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {status === 'submitting' ? 'Slanje...' : 'Dolazim!'}
                </button>
                {status === 'error' && (
                  <p className="text-red-400 text-sm text-center">Greška pri prijavi. Pokušaj ponovo.</p>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Field({
  label, name, type = 'text', value, onChange,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-300 text-sm font-medium">{label}</label>
      <input
        required
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-amber-500 transition-colors"
      />
    </div>
  )
}
