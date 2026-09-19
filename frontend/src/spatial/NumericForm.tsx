import { useId, useState, type ReactNode } from 'react'
import { Alert, Box, Button, TextField } from '@mui/material'
export type Field = { key: string; label: string; value: number; min?: number; positive?: boolean; max?: number; integer?: boolean }
export function NumericForm({ fields, action, onSubmit, children, heading, assignment, variant = 'default' }: {
  fields: Field[]; action: string; onSubmit: (values: Record<string, number>, target: string) => void
  children?: ReactNode; heading?: ReactNode; assignment?: ReactNode; variant?: 'default' | 'library'
}) {
  const id = useId()
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(f => [f.key, String(Number(f.value.toPrecision(10)))])))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  return <Box component="form" noValidate onKeyDown={event => { if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault() }} onSubmit={event => {
    event.preventDefault(); const values: Record<string, number> = {}; const issues: Record<string, string> = {}
    for (const f of fields) {
      const raw = draft[f.key] ?? String(f.value); const n = Number(raw)
      if (!raw.trim() || !Number.isFinite(n)) issues[f.key] = 'Enter a finite number.'
      else if ((f.positive && n <= 0) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max) || (f.integer && !Number.isInteger(n))) issues[f.key] = f.positive ? 'Must be greater than zero.' : `Enter ${f.integer ? 'an integer' : 'a value'}${f.min !== undefined ? ` ≥ ${f.min}` : ''}${f.max !== undefined ? ` and ≤ ${f.max}` : ''}.`
      values[f.key] = n
    }
    setErrors(issues); setFailure('')
    if (Object.keys(issues).length) { (event.currentTarget.elements.namedItem(Object.keys(issues)[0]) as HTMLInputElement)?.focus(); return }
    const target = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value || 'defaults'
    try { onSubmit(values, target) } catch (error) { setFailure(error instanceof Error ? error.message : 'Unable to apply values.') }
  }} sx={{ display: 'grid', gap: variant === 'library' ? 0 : 1.5 }}>
    <div className={variant === 'library' ? 'library-editor-card' : 'numeric-fields'}>
    {heading}
    {variant === 'library' ? fields.map(f => <label className="library-field" key={f.key}>
      <span>{f.label}</span><span><input name={f.key} inputMode="decimal" value={draft[f.key] ?? String(f.value)} aria-invalid={!!errors[f.key]} aria-describedby={errors[f.key] ? `${id}-${f.key}` : undefined} onChange={e => { setDraft({ ...draft, [f.key]: e.target.value }); setErrors({ ...errors, [f.key]: '' }) }} /></span>
      {errors[f.key] && <span className="library-field-error" id={`${id}-${f.key}`}>{errors[f.key]}</span>}
    </label>) :
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 1.5 }}>
      {fields.map(f => <TextField key={f.key} name={f.key} label={f.label} value={draft[f.key] ?? String(f.value)} error={!!errors[f.key]} helperText={errors[f.key]} onChange={e => { setDraft({ ...draft, [f.key]: e.target.value }); setErrors({ ...errors, [f.key]: '' }) }} slotProps={{ htmlInput: { inputMode: 'decimal' } }} />)}
    </Box>}
    {children}
    {failure && <Alert severity="error">{failure}</Alert>}
    {variant === 'library' ? <button type="submit" value="defaults" className="use-default-button">{action}</button> : <Button type="submit" variant="contained" fullWidth sx={{ mt: 1.5 }}>{action}</Button>}
    </div>
    {assignment}
  </Box>
}
