import * as THREE from 'three'
import { PALETTE } from './palette'
import type { NamedLocation, Vec3 } from './types'

function box(parent: THREE.Group, pos: Vec3, size: Vec3, color: string) {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2])
  const mat = new THREE.MeshLambertMaterial({ color })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(pos[0] + size[0] / 2, pos[1] + size[1] / 2, pos[2] + size[2] / 2)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function buildFloor(group: THREE.Group) {
  // Main floor
  box(group, [0, -0.1, 0], [24, 0.1, 16], PALETTE.carpet)
}

function buildWalls(group: THREE.Group) {
  // Back wall
  box(group, [0, 0, 15.5], [24, 8, 0.5], PALETTE.wall)
  // Left wall
  box(group, [-0.5, 0, 0], [0.5, 8, 16], PALETTE.wall)
  // Right wall
  box(group, [24, 0, 0], [0.5, 8, 16], PALETTE.wall)
}

function buildDesk(
  group: THREE.Group,
  x: number,
  z: number,
): { screen: THREE.Mesh; chair: THREE.Group } {
  // Desktop surface (lowered slightly for comfortable typing posture)
  box(group, [x, 0.8, z], [3, 0.15, 2], PALETTE.deskTop)
  // Legs
  box(group, [x, 0, z], [0.2, 0.8, 0.2], PALETTE.deskLegs)
  box(group, [x + 2.8, 0, z], [0.2, 0.8, 0.2], PALETTE.deskLegs)
  box(group, [x, 0, z + 1.8], [0.2, 0.8, 0.2], PALETTE.deskLegs)
  box(group, [x + 2.8, 0, z + 1.8], [0.2, 0.8, 0.2], PALETTE.deskLegs)

  // Monitor
  box(group, [x + 0.8, 0.95, z + 1.2], [1.4, 1.0, 0.1], PALETTE.monitorFrame)
  const screen = box(group, [x + 0.9, 1.05, z + 1.19], [1.2, 0.8, 0.1], PALETTE.monitorScreen)
  // Monitor stand
  box(group, [x + 1.3, 0.95, z + 1.0], [0.4, 0.05, 0.4], PALETTE.monitorFrame)

  // Keyboard (moved closer to desk edge for character reach)
  box(group, [x + 0.8, 0.97, z + 0.15], [1.2, 0.05, 0.4], PALETTE.keyboard)

  // Chair — as a separate group so it can slide in/out (raised slightly)
  const chair = new THREE.Group()
  box(chair, [x + 1.1, 0, z - 0.8], [0.8, 1.3, 0.1], PALETTE.chair)
  box(chair, [x + 1.1, 0.45, z - 0.7], [0.8, 0.15, 0.5], PALETTE.chairSeat)
  // Front legs
  box(chair, [x + 1.1, 0, z - 0.3], [0.1, 0.45, 0.1], PALETTE.chair)
  box(chair, [x + 1.8, 0, z - 0.3], [0.1, 0.45, 0.1], PALETTE.chair)
  group.add(chair)

  return { screen, chair }
}

function buildWhiteboard(group: THREE.Group) {
  // Board
  box(group, [10, 3, 15], [4, 3, 0.2], PALETTE.whiteboardFrame)
  box(group, [10.2, 3.2, 14.9], [3.6, 2.6, 0.1], PALETTE.whiteboard)
}

function buildBuildLight(group: THREE.Group): THREE.Mesh {
  // Build status light next to whiteboard
  const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
  const mat = new THREE.MeshLambertMaterial({ color: PALETTE.buildGreen })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(14.5, 6.3, 15.2)
  mesh.castShadow = true
  group.add(mesh)
  return mesh
}

function buildCoffeeMachine(group: THREE.Group) {
  box(group, [21, 0, 13], [2, 3, 2], PALETTE.coffeeMachine)
  box(group, [21.5, 3, 13.5], [1, 0.5, 1], PALETTE.coffeeMachine)
  // Cup
  box(group, [21.3, 3, 13.2], [0.3, 0.4, 0.3], PALETTE.coffeeCup)
}

function buildMeetingArea(group: THREE.Group) {
  // Simple circle of markers on the floor
  const cx = 3,
    cz = 13
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const x = cx + Math.cos(angle) * 1.5
    const z = cz + Math.sin(angle) * 1.5
    box(group, [x - 0.15, 0, z - 0.15], [0.3, 0.05, 0.3], PALETTE.wallAccent)
  }
}

export interface WallClock {
  minuteHand: THREE.Group
  hourHand: THREE.Group
}

function buildWallClock(group: THREE.Group): WallClock {
  const cx = 18,
    cy = 5.5,
    cz = 15.25
  const radius = 0.7

  // Clock face (circle facing -z)
  const faceGeo = new THREE.CircleGeometry(radius, 32)
  const faceMat = new THREE.MeshLambertMaterial({ color: PALETTE.whiteboard })
  const face = new THREE.Mesh(faceGeo, faceMat)
  face.position.set(cx, cy, cz)
  face.rotation.y = Math.PI // face toward camera (-z)
  group.add(face)

  // Rim
  const rimGeo = new THREE.RingGeometry(radius - 0.03, radius + 0.04, 32)
  const rimMat = new THREE.MeshLambertMaterial({
    color: PALETTE.monitorFrame,
    side: THREE.DoubleSide,
  })
  const rim = new THREE.Mesh(rimGeo, rimMat)
  rim.position.set(cx, cy, cz - 0.01)
  rim.rotation.y = Math.PI
  group.add(rim)

  // Hour markers (12 small ticks)
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const inner = radius - 0.12
    const outer = radius - 0.05
    const mx = Math.sin(angle)
    const my = Math.cos(angle)
    const tickGeo = new THREE.BoxGeometry(0.03, outer - inner, 0.02)
    const tickMat = new THREE.MeshLambertMaterial({ color: PALETTE.monitorFrame })
    const tick = new THREE.Mesh(tickGeo, tickMat)
    tick.position.set(
      cx - mx * (inner + (outer - inner) / 2),
      cy + my * (inner + (outer - inner) / 2),
      cz - 0.02,
    )
    tick.rotation.z = -angle
    group.add(tick)
  }

  // Center dot
  const dotGeo = new THREE.CircleGeometry(0.04, 16)
  const dotMat = new THREE.MeshLambertMaterial({ color: PALETTE.monitorFrame })
  const dot = new THREE.Mesh(dotGeo, dotMat)
  dot.position.set(cx, cy, cz - 0.03)
  dot.rotation.y = Math.PI
  group.add(dot)

  // Hands — each in a group so rotation pivots at the base
  function makeHand(length: number, width: number): THREE.Group {
    const handGroup = new THREE.Group()
    handGroup.position.set(cx, cy, cz - 0.03)
    const geo = new THREE.BoxGeometry(width, length, 0.02)
    const mat = new THREE.MeshLambertMaterial({ color: PALETTE.monitorFrame })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(0, length / 2, 0) // offset so base is at origin
    handGroup.add(mesh)
    group.add(handGroup)
    return handGroup
  }

  const hourHand = makeHand(0.32, 0.05)
  const minuteHand = makeHand(0.5, 0.035)

  return { minuteHand, hourHand }
}

const STANDUP_CENTER: Vec3 = [12, 0, 12]
const SLOTS_PER_RING = 6
const RING_BASE_RADIUS = 1.8
const RING_SPACING = 1.4

/** Generate standup circle locations — adds concentric rings as team grows. */
export function buildStandupCircle(teamSize: number): NamedLocation[] {
  const slots = Math.max(teamSize, 3)
  const locations: NamedLocation[] = []
  for (let i = 0; i < slots; i++) {
    const ring = Math.floor(i / SLOTS_PER_RING)
    const indexInRing = i % SLOTS_PER_RING
    const slotsInThisRing = Math.min(SLOTS_PER_RING, slots - ring * SLOTS_PER_RING)
    const radius = RING_BASE_RADIUS + ring * RING_SPACING
    const angle = (indexInRing / slotsInThisRing) * Math.PI * 2
    const x = STANDUP_CENTER[0] + Math.cos(angle) * radius
    const z = STANDUP_CENTER[2] + Math.sin(angle) * radius
    const dx = STANDUP_CENTER[0] - x
    const dz = STANDUP_CENTER[2] - z
    locations.push({
      name: `standup_${i}`,
      position: [x, 0, z],
      seatDirection: [dx, 0, dz],
    })
  }
  return locations
}

const DESK_COUNT = 4

/** Generate overflow work spots for workers beyond the 4 desks. */
export function buildOverflowSpots(teamSize: number): NamedLocation[] {
  const count = Math.max(0, teamSize - DESK_COUNT)
  const locations: NamedLocation[] = []
  for (let i = 0; i < count; i++) {
    const x = 3 + ((i * 3) % 18)
    locations.push({
      name: `overflow_${i}`,
      position: [x, 0, 8 + Math.floor(i / 6) * 2],
      seatDirection: [0, 0, 1],
    })
  }
  return locations
}

function buildPlant(group: THREE.Group, x: number, z: number) {
  box(group, [x, 0, z], [0.6, 0.8, 0.6], PALETTE.plantPot)
  box(group, [x - 0.1, 0.8, z - 0.1], [0.8, 1.0, 0.8], PALETTE.plant)
}

export interface OfficeScene {
  group: THREE.Group
  buildLight: THREE.Mesh
  wallClock: WallClock
  locations: NamedLocation[]
  screenMeshes: THREE.Mesh[]
  chairGroups: THREE.Group[]
}

export function createOffice(teamSize = 6): OfficeScene {
  const group = new THREE.Group()
  const screenMeshes: THREE.Mesh[] = []
  const chairGroups: THREE.Group[] = []

  buildFloor(group)
  buildWalls(group)

  // 4 desks in 2 pairs (front-left pair, front-right pair)
  const deskPositions: Vec3[] = [
    [2, 0, 2], // desk_0
    [6, 0, 2], // desk_1
    [14, 0, 2], // desk_2
    [18, 0, 2], // desk_3
  ]
  for (const pos of deskPositions) {
    const { screen, chair } = buildDesk(group, pos[0], pos[2])
    screenMeshes.push(screen)
    chairGroups.push(chair)
  }

  buildWhiteboard(group)
  const buildLight = buildBuildLight(group)
  const wallClock = buildWallClock(group)
  buildCoffeeMachine(group)
  buildMeetingArea(group)

  // Decorative plants
  buildPlant(group, 0.5, 0.5)
  buildPlant(group, 23, 0.5)

  const standupLocations = buildStandupCircle(teamSize)

  const overflowLocations = buildOverflowSpots(teamSize)

  const locations: NamedLocation[] = [
    { name: 'desk_0', position: [3.5, 0, 1.5], seatDirection: [0, 0, 1] },
    { name: 'desk_1', position: [7.5, 0, 1.5], seatDirection: [0, 0, 1] },
    { name: 'desk_2', position: [15.5, 0, 1.5], seatDirection: [0, 0, 1] },
    { name: 'desk_3', position: [19.5, 0, 1.5], seatDirection: [0, 0, 1] },
    { name: 'coffee', position: [22, 0, 14] },
    { name: 'meeting', position: [3, 0, 13] },
    { name: 'whiteboard', position: [12, 0, 14] },
    ...overflowLocations,
    ...standupLocations,
  ]

  return { group, buildLight, wallClock, locations, screenMeshes, chairGroups }
}
