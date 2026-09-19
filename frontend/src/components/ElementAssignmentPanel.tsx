import CheckIcon from '@mui/icons-material/Check'
import type { ReactNode } from 'react'

export type AssignmentRow = { id: number; label: ReactNode; assigned?: boolean; other?: boolean; title?: string }

/** The same assignment surface serves 2D library definitions and validated 3D property forms. */
export function ElementAssignmentPanel({ kind, rows, onApply, onApplyAll, selectedCount, footer }: {
  kind: 'material' | 'section'
  rows: AssignmentRow[]
  onApply?: (id: number) => void
  onApplyAll?: () => void
  selectedCount?: number
  footer?: ReactNode
}) {
  const submit = !onApply
  return <section className="library-apply-section" aria-label={`${kind === 'material' ? 'Material' : 'Section'} apply to elements`} data-assignment-overlay-keep>
    <div className="library-section-title">
      <div><span>ASSIGNMENT</span><strong>Apply to elements</strong></div>
      <button type={submit ? 'submit' : 'button'} name="assignment" value="all" disabled={!rows.length} onClick={onApplyAll} aria-label={`Apply ${kind} to all elements`}><CheckIcon sx={{ fontSize: 16 }} /> Apply all</button>
    </div>
    {selectedCount !== undefined && <button className="assignment-details-footer" type="submit" name="assignment" value="selected" disabled={!selectedCount}>Apply to selected ({selectedCount})</button>}
    <div className="element-assignment-list">
      {!rows.length && <div className="library-empty-inline">Create an element before assigning properties.</div>}
      {rows.map(row => <button key={row.id} type={submit ? 'submit' : 'button'} name="assignment" value={`element:${row.id}`} className={row.assigned ? 'is-assigned' : row.other ? 'is-assigned-other' : ''} title={row.title} aria-label={`Apply ${kind} to E${row.id}`} onClick={onApply ? () => onApply(row.id) : undefined}>
        <span className="assignment-element">E{row.id}</span>
        <span>{row.assigned && <CheckIcon sx={{ fontSize: 14 }} />}{row.label}</span>
      </button>)}
    </div>
    {footer}
  </section>
}
