import { requestJson } from './httpClient'
import { toSpatialPayload, type Model3D, type Result3D } from '../spatial/model'

export function solveSpatialFrame(model: Model3D, signal?: AbortSignal): Promise<Result3D> {
  return requestJson<Result3D>('/api/v1/3d/solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toSpatialPayload(model)),
    signal,
  }, 120_000)
}
