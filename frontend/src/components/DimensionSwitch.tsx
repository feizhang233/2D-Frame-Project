import { ToggleButton, ToggleButtonGroup } from '@mui/material'
export function DimensionSwitch({ value, onChange }: { value: '2D' | '3D'; onChange: (value: '2D' | '3D') => void }) {
  return <ToggleButtonGroup exclusive size="small" value={value} onChange={(_, next) => next && onChange(next)} aria-label="Model dimension" sx={{ flexShrink: 0 }}>
    <ToggleButton value="2D" aria-label="2D workspace" sx={{ px: 1.5, fontWeight: 700 }}>2D</ToggleButton>
    <ToggleButton value="3D" aria-label="3D workspace" sx={{ px: 1.5, fontWeight: 700 }}>3D</ToggleButton>
  </ToggleButtonGroup>
}
