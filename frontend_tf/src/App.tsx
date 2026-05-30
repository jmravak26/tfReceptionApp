import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const EVENT = {
  date: '6.6.2026',
  time: '16:00',
  location: 'Gala',
  mapsUrl: 'https://maps.app.goo.gl/SywpdWw6fKERC8ej8',
}

type FormState = { name: string; surname: string; email: string }
type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function App() {
  const [form, setForm] = useState<FormState>({ name: '', surname: '', email: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [spinning, setSpinning] = useState(false)

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
      await addDoc(collection(db, 'registrations'), {
        ...form,
        registeredAt: serverTimestamp(),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/pictures/group_photo.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-gray-900/80 rounded-2xl shadow-xl p-8">
        <div className="logo-fade">
          <img
            src="/imagesLogo/logo_tf_bili.png"
            alt="TF Logo"
            className={`h-32 mx-auto mb-6 cursor-pointer select-none animate-float ${spinning ? 'spinning' : ''}`}
            onClick={handleLogoClick}
            onAnimationEnd={(e) => { if (e.animationName === 'spin-twice') setSpinning(false) }}
          />
        </div>

        <h1 className="text-2xl font-bold text-white mb-1 text-center">Prijava na domjenak</h1>
        <p className="text-gray-400 text-sm mb-6">
          Dolaziš li na domjenak{' '}
          <span className="text-amber-400 font-medium">{EVENT.date}</span> u{' '}
          <span className="text-amber-400 font-medium">{EVENT.time}</span> sati na lokaciji{' '}
          <a
            href={EVENT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 font-medium underline underline-offset-2 hover:text-amber-300 transition-colors"
          >
            {EVENT.location}
          </a>?
        </p>

        {status === 'success' ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-white font-semibold">Uspješno si prijavljen/a!</p>
            <p className="text-gray-400 text-sm mt-1">Vidimo se na zabavi, {form.name}!</p>
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
