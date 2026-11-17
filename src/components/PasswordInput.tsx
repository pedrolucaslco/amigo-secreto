import { useState, type InputHTMLAttributes } from 'react'

const eye = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const eyeOff = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.9 17.9A10.5 10.5 0 0 1 12 19C5.500 19 2 12 2 12a18 18 0 0 1 4.100-5.100" />
    <path d="M9.900 5.200A9.500 9.500 0 0 1 12 5c6.500 0 10 7 10 7a18 18 0 0 1-2.200 3.200" />
    <path d="M9.900 9.900a3 3 0 0 0 4.200 4.200" />
    <path d="M3 3l18 18" />
  </svg>
)

export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="pw-wrap">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
      >
        {visible ? eyeOff : eye}
      </button>
    </div>
  )
}
