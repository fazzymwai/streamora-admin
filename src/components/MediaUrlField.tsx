// Every media reference on the movie form goes through this component so the
// text input can be swapped for a Storage upload widget (with progress) once
// the bucket is provisioned — callers won't change.
interface MediaUrlFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
}

export default function MediaUrlField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  hint,
}: MediaUrlFieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="url"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}
