import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, IconButton, InputBase, MenuItem, Snackbar, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useMediaQuery } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { solveSpatialFrame } from '../api/spatialApi'
import TuneIcon from '@mui/icons-material/Tune'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import CropSquareIcon from '@mui/icons-material/CropSquare'
import { ToolRail } from '../components/ToolRail'
import { LibraryHeader } from '../components/LibraryPanels'
import { BrandMark } from '../components/TopToolbar'
import { DimensionSwitch } from '../components/DimensionSwitch'
import { useConfirm } from '../components/ConfirmProvider'
import { readBrowserStorage, writeBrowserStorage } from '../utils/browserStorage'
import { blankModel, defaultSection, deleteSelected, emptySelection, example3D, insertMember, insertNode, modelIssues, parseModel3D, planeCoords, planeLabels, toSpatialPayload, xyz, type Model3D, type Plane, type Result3D, type Selection, type Tool, type Vec3 } from './model'
import { SpatialCanvas, displayNames, type Display } from './SpatialCanvas'
import { Inspector, toolNames } from './Inspector'
import { SpatialResults } from './SpatialResults'

const STORAGE = 'frame-studio.3d.model.v1'
function initialWorkspace() {
  const value = readBrowserStorage(STORAGE)
  if (!value) return { model: example3D(), warning: '' }
  try { return { model: parseModel3D(JSON.parse(value)), warning: '' } } catch { return { model: example3D(), warning: 'The saved 3D draft could not be read. An example is shown. Your saved draft is unchanged until you edit this model.' } }
}
const shortcuts: Record<string, Tool> = { v: 'select', n: 'node', e: 'member', m: 'material', s: 'support', c: 'section', l: 'load', h: 'tables' }
export function SpatialWorkbench({ active, onDimensionChange }: { active: boolean; onDimensionChange: (value: '2D' | '3D') => void }) {
  const [initial] = useState(initialWorkspace); const [model, setModel] = useState(initial.model)
  const [selection, setSelection] = useState<Selection>(emptySelection); const [tool, setTool] = useState<Tool>('select')
  const [defaults, setDefaults] = useState(defaultSection); const [templates, setTemplates] = useState(defaultSection); const [propertiesCollapsed, setPropertiesCollapsed] = useState(false); const [chain, setChain] = useState<number | null>(null)
  const [past, setPast] = useState<Model3D[]>([]); const [future, setFuture] = useState<Model3D[]>([])
  const [plane, setPlane] = useState<Plane>('XZ'); const [offset, setOffset] = useState(0); const [offsetDraft, setOffsetDraft] = useState('0'); const [offsetError, setOffsetError] = useState(false)
  const [grid, setGrid] = useState(1); const [gridDraft, setGridDraft] = useState('1'); const [gridError, setGridError] = useState(false)
  const [snap, setSnap] = useState(true); const [labels, setLabels] = useState(true); const [view, setView] = useState<'split' | 'plane' | '3d'>('split')
  const [fitKey, setFitKey] = useState(0); const [drawer, setDrawer] = useState(false); const [help, setHelp] = useState(false)
  const [message, setMessage] = useState(''); const [storageWarning, setStorageWarning] = useState(initial.warning); const [saved, setSaved] = useState(false)
  const [result, setResult] = useState<Result3D | null>(null); const [running, setRunning] = useState(false); const [error, setError] = useState<string | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false); const [display, setDisplay] = useState<Display>('model'); const [deformationScale, setDeformationScale] = useState(100)
  const abort = useRef<AbortController | null>(null); const revision = useRef(0); const input = useRef<HTMLInputElement>(null); const importToken = useRef(0)
  const compact = useMediaQuery('(max-width: 1050px)'); const small = useMediaQuery('(max-width: 700px)'); const confirm = useConfirm()
  const activeView = small && view === 'split' ? 'plane' : view
  const persist = (next: Model3D) => { const ok = writeBrowserStorage(STORAGE, JSON.stringify(next)); setSaved(ok); setStorageWarning(ok ? '' : 'Local saving is unavailable. Export JSON to keep this model.') }
  const invalidate = () => { abort.current?.abort(); abort.current = null; revision.current++; setRunning(false); setError(null); setResult(null); setDisplay('model') }
  const change = (next: Model3D, toast?: string) => {
    const checked = parseModel3D(next)
    if (JSON.stringify(model) === JSON.stringify(checked)) { if (toast) setMessage(toast); return }
    invalidate(); setPast(p => [...p.slice(-49), model]); setFuture([]); setModel(checked); persist(checked)
    if (toast) setMessage(toast)
  }
  const select = (kind: 'nodes' | 'elements', id: number | null, extend: boolean) => {
    setSelection(current => id === null ? emptySelection() : extend ? { ...current, [kind]: current[kind].includes(id) ? current[kind].filter(v => v !== id) : [...current[kind], id] } : { ...emptySelection(), [kind]: [id] })
  }
  const chooseTool = (next: Tool) => { setTool(next); setChain(null); if (next !== 'select') { setPropertiesCollapsed(false); if (compact) setDrawer(true) } }
  const toggleProperties = () => { if (compact) setDrawer(v => !v); else setPropertiesCollapsed(v => !v) }
  const undo = () => { if (!past.length) return; const next = past.at(-1)!; invalidate(); setFuture(f => [model, ...f]); setPast(p => p.slice(0, -1)); setModel(next); persist(next); setSelection(emptySelection()); setChain(null) }
  const redo = () => { if (!future.length) return; const next = future[0]; invalidate(); setPast(p => [...p, model]); setFuture(f => f.slice(1)); setModel(next); persist(next); setSelection(emptySelection()); setChain(null) }
  const remove = async () => {
    if (!selection.nodes.length && !selection.elements.length) return
    if (!await confirm(`Delete ${selection.nodes.length} selected node(s) and ${selection.elements.length} selected member(s)? Members connected to deleted nodes and their assignments will also be removed. You can undo this change.`, 'Delete objects')) return
    change(deleteSelected(model, selection), 'Selected objects deleted'); setSelection(emptySelection()); setChain(null)
  }
  const point = (p: Vec3) => {
    try {
      if (tool === 'node' || chain === null) {
        const inserted = insertNode(model, p); change(inserted.model); select('nodes', inserted.id, false)
        if (tool === 'member') setChain(inserted.id)
      } else {
        const inserted = insertMember(model, xyz(model.nodes[chain - 1]), p, defaults); change(inserted.model, 'Member added'); setChain(inserted.id); select('nodes', inserted.id, false)
      }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to draw this member.') }
  }
  const replace = async (next: Model3D) => {
    if (model.nodes.length && !await confirm('Replace the current 3D model? The replacement is saved locally. Undo can restore this model.', 'Replace model')) return
    change(next); setSelection(emptySelection()); setChain(null); setFitKey(k => k + 1); setResultsOpen(false)
  }
  const openFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
    const token = ++importToken.current
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('The maximum JSON file size is 10 MB.')
      const next = parseModel3D(JSON.parse(await file.text())); if (token !== importToken.current) return
      if (next.name === 'Imported space frame') next.name = file.name.replace(/\.json$/i, '')
      await replace(next)
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to read this 3D model.') }
  }
  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(toSpatialPayload(model), null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${model.name.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-') || 'space-frame'}.json`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    persist(model); setMessage('3D model exported as JSON')
  }
  const run = async () => {
    if (running) return
    setResultsOpen(true); setError(null); setChain(null)
    const issues = modelIssues(model)
    if (issues.length) { setError(issues.slice(0, 8).join(' ')); return }
    const controller = new AbortController(); abort.current?.abort(); abort.current = controller; const version = revision.current
    setRunning(true)
    try {
      const response = await solveSpatialFrame(model, controller.signal)
      if (controller.signal.aborted || version !== revision.current) return
      setResult(response); setDisplay('deformed'); setMessage(response.validation.passed ? 'Analysis complete · equilibrium and energy checks passed' : 'Analysis complete · review numerical checks')
    } catch (e) { if (!controller.signal.aborted && version === revision.current) setError(e instanceof Error ? e.message : 'Analysis failed. Check the model and try again.') }
    finally { if (abort.current === controller) { abort.current = null; setRunning(false) } }
  }
  const cancel = () => { abort.current?.abort(); abort.current = null; setRunning(false); setMessage('Analysis cancelled') }
  useEffect(() => { if (!active) { abort.current?.abort(); abort.current = null; setRunning(false); setChain(null); setDrawer(false) } }, [active])
  useEffect(() => () => { abort.current?.abort() }, [])
  useEffect(() => {
    if (!active) return
    const keydown = (e: KeyboardEvent) => {
      if (e.isComposing || (e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"]') || document.querySelector('[role="dialog"]')) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); exportFile(); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return }
      if (e.key === 'Escape') { setChain(null); setTool('select'); return }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); void remove(); return }
      if (e.key === '?') { setHelp(true); return }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const match = shortcuts[e.key.toLowerCase()]; if (match) chooseTool(match)
    }
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown)
  })
  const setLevel = (value: number) => { setOffset(value); setOffsetDraft(String(value)); setOffsetError(false); setChain(null) }
  const stepPlane = (direction: number) => {
    const levels = [...new Set(model.nodes.map(n => planeCoords(plane, xyz(n))[2]))].sort((a, b) => a - b)
    const next = direction > 0 ? levels.find(v => v > offset + 1e-8) : [...levels].reverse().find(v => v < offset - 1e-8)
    setLevel(next ?? offset + grid * direction)
  }
  const inspector = <><LibraryHeader icon={tool === 'material' ? <LibraryBooksIcon /> : tool === 'section' ? <CropSquareIcon /> : <TuneIcon />} eyebrow="MODEL SETUP" title={toolNames[tool]} subtitle="3D" onToggleCollapsed={toggleProperties} />
    {compact && <IconButton className="spatial-drawer-close" aria-label="Close properties" onClick={() => setDrawer(false)}><CloseIcon fontSize="small" /></IconButton>}
    <Inspector key={tool} revision={revision.current} model={model} selection={selection} tool={tool} defaults={defaults} templates={templates} onTemplates={setTemplates} onExample={() => void replace(example3D())} onDefaults={setDefaults} onChange={change} onSelect={select} onDelete={() => void remove()} onTool={chooseTool} onMessage={setMessage} /></>
  const canvasProps = { model, selection, tool, plane, offset, grid, snap, chain, fitKey, result, display, deformationScale, labels, onSelect: select, onPoint: point, onEnd: () => setChain(null), onMessage: setMessage }
  return <div className="spatial-shell">
    <header className="spatial-topbar">
      <div className="spatial-brand"><BrandMark /><div className="spatial-brand-copy"><strong>Frame Studio</strong><span>3D ANALYSIS</span></div></div>
      <DimensionSwitch value="3D" onChange={onDimensionChange} />
      <div className="spatial-file-actions" aria-label="File actions">{compact ? <><Tooltip title="New 3D model"><IconButton aria-label="New 3D model" onClick={() => void replace(blankModel())}><AddIcon /></IconButton></Tooltip><Tooltip title="Open 3D JSON"><IconButton aria-label="Open 3D JSON" onClick={() => input.current?.click()}><FolderOpenIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Export JSON (⌘ / Ctrl S)"><IconButton aria-label="Export 3D JSON" onClick={exportFile}><SaveAltIcon fontSize="small" /></IconButton></Tooltip></> : <><Button size="small" color="inherit" startIcon={<NoteAddIcon />} aria-label="New 3D model" onClick={() => void replace(blankModel())}>New</Button><Button size="small" color="inherit" startIcon={<FolderOpenIcon />} aria-label="Open 3D JSON" onClick={() => input.current?.click()}>Open</Button><Button size="small" color="inherit" startIcon={<SaveAltIcon />} aria-label="Export 3D JSON" onClick={exportFile}>Export</Button></>}</div>
      <input ref={input} type="file" accept="application/json,.json" hidden onChange={openFile} />
      <InputBase className="spatial-model-name" key={model.name} defaultValue={model.name} onBlur={e => { const name = e.target.value.trim(); if (name && name !== model.name) change({ ...model, name }); else e.target.value = model.name }} inputProps={{ 'aria-label': '3D model name', maxLength: 120 }} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) (e.target as HTMLInputElement).blur() }} />
      <span className="local-save-state">{saved ? 'Saved locally' : 'Local workspace'}</span>
      <Tooltip title="Undo (⌘ / Ctrl Z)"><span><IconButton disabled={!past.length} aria-label="Undo 3D change" onClick={undo}><UndoIcon fontSize="small" /></IconButton></span></Tooltip>
      <Tooltip title="Redo (⌘ / Ctrl Shift Z)"><span><IconButton disabled={!future.length} aria-label="Redo 3D change" onClick={redo}><RedoIcon fontSize="small" /></IconButton></span></Tooltip>
      <IconButton aria-label="3D workflow help" onClick={() => setHelp(true)}><HelpOutlineIcon fontSize="small" /></IconButton>
      <Button className="spatial-run" variant="contained" startIcon={<PlayArrowIcon />} disabled={running} onClick={() => void run()}>{running ? 'Solving…' : 'Run analysis'}</Button>
    </header>
    {storageWarning && <Alert severity="warning" onClose={() => setStorageWarning('')}>{storageWarning}</Alert>}
    <div className="spatial-commandbar">
      <div className="plane-controls"><Typography variant="caption" className="command-label">WORK PLANE</Typography>
        <ToggleButtonGroup exclusive size="small" value={plane} onChange={(_, value) => { if (value) { setPlane(value); setChain(null) } }} aria-label="Working plane">{(['XY', 'XZ', 'YZ'] as Plane[]).map(p => <ToggleButton value={p} key={p} aria-label={`${p} plane`}>{p}</ToggleButton>)}</ToggleButtonGroup>
        <IconButton size="small" aria-label="Previous model plane" onClick={() => stepPlane(-1)}><ChevronLeftIcon /></IconButton>
        <TextField label={`${planeLabels(plane)[2]} (m)`} value={offsetDraft} error={offsetError} helperText={offsetError ? 'Finite number required' : undefined} onChange={e => setOffsetDraft(e.target.value)} onBlur={() => { if (!offsetDraft.trim() || !Number.isFinite(Number(offsetDraft))) setOffsetError(true); else setLevel(Number(offsetDraft)) }} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) (e.target as HTMLInputElement).blur() }} slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': 'Working plane offset' } }} sx={{ width: 96 }} />
        <IconButton size="small" aria-label="Next model plane" onClick={() => stepPlane(1)}><ChevronRightIcon /></IconButton>
      </div>
      <Divider orientation="vertical" flexItem />
      <TextField label="Grid (m)" value={gridDraft} error={gridError} helperText={gridError ? 'Enter a positive number' : undefined} onChange={e => setGridDraft(e.target.value)} onBlur={() => { const value = Number(gridDraft); if (!gridDraft.trim() || !Number.isFinite(value) || value <= 0) setGridError(true); else { setGrid(value); setGridError(false) } }} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) (e.target as HTMLInputElement).blur() }} sx={{ width: 84 }} />
      <label className="compact-switch"><Switch size="small" checked={snap} onChange={(_, value) => setSnap(value)} />Snap</label>
      <label className="compact-switch"><Switch size="small" checked={labels} onChange={(_, value) => setLabels(value)} />Labels</label>
      <div className="spatial-spacer" />
      <ToggleButtonGroup exclusive size="small" value={activeView} onChange={(_, value) => value && setView(value)} aria-label="View layout"><ToggleButton value="plane">2D plane</ToggleButton><ToggleButton value="3d">3D view</ToggleButton>{!small && <ToggleButton value="split">Split view</ToggleButton>}</ToggleButtonGroup>
    </div>
    <main className="spatial-main">
      <div className="spatial-rail"><ToolRail dimension="3D" bottomLabel="Tables" activeTool={tool === 'member' ? 'element' : tool === 'tables' ? 'models' : tool} onToolChange={next => chooseTool(next === 'element' ? 'member' : next === 'models' ? 'tables' : next === 'insert-node' ? 'node' : next)} onSelectDoubleClick={toggleProperties} /></div>
      {!compact && <aside className={`spatial-inspector properties-panel ${propertiesCollapsed ? 'spatial-inspector--collapsed' : ''}`}>
        {propertiesCollapsed ? <button type="button" className="properties-collapse-trigger" aria-label="Open Properties" onClick={() => setPropertiesCollapsed(false)}><ChevronRightIcon /><span>Properties</span></button> : inspector}
      </aside>}
      <div className="spatial-stage">
        <div className="spatial-stage-heading"><div><span className="workspace-eyebrow">MODEL SPACE / 3D</span><strong>{tool === 'member' ? chain ? `Continue from node ${chain}` : 'Click the first point' : tool === 'node' ? 'Place a node on the active plane' : model.name}</strong></div><div className="model-counts"><span>{model.nodes.length} nodes</span><span>{model.elements.length} members</span></div></div>
        <div className="spatial-displaybar"><span className="spatial-muted">{tool === 'member' || tool === 'node' ? 'Right-click: end chain · Esc: select' : 'Shift + click: multi-select · Drag: orbit / pan'}</span><div className="spatial-spacer" />
          {compact && <Button size="small" onClick={() => setDrawer(true)}>Properties</Button>}
          {result && <><TextField select size="small" label="Display" value={display} onChange={e => setDisplay(e.target.value as Display)} sx={{ minWidth: 180 }}>{Object.entries(displayNames).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>{display === 'deformed' && <TextField label="Scale ×" type="number" value={deformationScale} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 0 && n <= 1e8) setDeformationScale(n) }} sx={{ width: 95 }} />}</>}
        </div>
        <div className={`spatial-canvases layout-${activeView}`}>{activeView !== '3d' && <SpatialCanvas {...canvasProps} spatial={false} />}{activeView !== 'plane' && <SpatialCanvas {...canvasProps} spatial />}</div>
        <SpatialResults result={result} running={running} error={error} expanded={resultsOpen} onExpand={() => setResultsOpen(v => !v)} onRun={() => void run()} onCancel={cancel} selection={selection} onSelect={select} />
      </div>
    </main>
    <footer className="spatial-status"><span className="status-dot" />{running ? 'Analysis running' : 'Ready'}<span>{plane} · {planeLabels(plane)[2]} = {offset} m</span><span>{snap ? `Snap ${grid} m` : 'Snap off'}</span><div className="spatial-spacer" /><span>m · kN · GPa</span><span>Linear elastic / small displacement</span></footer>
    <Drawer anchor="left" open={active && compact && drawer} onClose={() => setDrawer(false)} slotProps={{ paper: { sx: { width: 'min(340px, 92vw)' } } }}>{inspector}</Drawer>
    <Snackbar open={active && !!message} autoHideDuration={4000} onClose={(_, reason) => { if (reason !== 'clickaway') setMessage('') }} message={message} action={<IconButton aria-label="Dismiss message" size="small" color="inherit" onClick={() => setMessage('')}><CloseIcon fontSize="small" /></IconButton>} />
    <Dialog open={active && help} onClose={() => setHelp(false)} maxWidth="sm" fullWidth aria-labelledby="spatial-help-title"><DialogTitle id="spatial-help-title">A familiar structural modeling workflow</DialogTitle><DialogContent dividers>
      <Box component="ol" sx={{ pl: 2.5, m: 0, '& li': { mb: 2 } }}><li><strong>Choose a work plane.</strong> Select XY, XZ, or YZ and enter its position. The arrow buttons move between existing model levels.</li><li><strong>Draw nodes and members.</strong> N places nodes; E starts a member chain. Snap to grid points and existing joints. Right-click ends the chain; Esc returns to selection. Use exact coordinates for points outside the current plane.</li><li><strong>Select and assign.</strong> V selects objects; Shift adds to the selection. M edits material, C edits section, S assigns supports, L assigns loads. Each property definition has its own Apply to elements list. Double-click Select to hide or show Properties. H opens model tables with selectable rows.</li><li><strong>Inspect in 3D.</strong> Drag to orbit, Shift-drag to pan, and scroll to zoom. View buttons provide the same rotate, tilt, zoom and fit controls.</li><li><strong>Analyze and review.</strong> Run the 3D solver, inspect displacement and force diagrams, and open the numeric tables. Model edits invalidate previous results.</li></Box>
      <Alert severity="info">2D and 3D have independent models. Switching keeps both workspaces; it does not convert a model. 3D edits save locally in this browser. Export JSON for a portable copy. The 3D core supports linear static beam analysis, with optional Timoshenko members for nodal loads.</Alert>
    </DialogContent><DialogActions><Button onClick={() => setHelp(false)}>Start modeling</Button></DialogActions></Dialog>
  </div>
}
