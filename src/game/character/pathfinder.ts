import type { NamedLocation, Vec3 } from '../types'

/** Move speed in units per game-minute tick. */
const MOVE_SPEED = 0.5

export function findLocation(locations: NamedLocation[], name: string): NamedLocation | undefined {
  return locations.find((l) => l.name === name)
}

export function distanceTo(a: Vec3, b: Vec3): number {
  const dx = b[0] - a[0]
  const dz = b[2] - a[2]
  return Math.sqrt(dx * dx + dz * dz)
}

/** Linearly interpolate position toward target. Returns new position and whether arrived. */
export function moveToward(
  current: Vec3,
  target: Vec3,
  speed: number = MOVE_SPEED,
): { position: Vec3; arrived: boolean } {
  const dist = distanceTo(current, target)
  if (dist <= speed) {
    return { position: [target[0], target[1], target[2]], arrived: true }
  }

  const dx = target[0] - current[0]
  const dz = target[2] - current[2]
  const ratio = speed / dist

  return {
    position: [current[0] + dx * ratio, current[1], current[2] + dz * ratio],
    arrived: false,
  }
}

/** Get the facing angle (Y rotation) from current position toward target. */
export function facingAngle(from: Vec3, to: Vec3): number {
  return Math.atan2(to[0] - from[0], to[2] - from[2])
}
