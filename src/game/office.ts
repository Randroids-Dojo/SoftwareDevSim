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

function buildDesk(group: THREE.Group, x: number, z: number): THREE.Mesh {
  // Desktop surface
  box(group, [x, 2.2, z], [3, 0.2, 2], PALETTE.deskTop)
  // Legs
  box(group, [x, 0, z], [0.2, 2.2, 0.2], PALETTE.deskLegs)
  box(group, [x + 2.8, 0, z], [0.2, 2.2, 0.2], PALETTE.deskLegs)
  box(group, [x, 0, z + 1.8], [0.2, 2.2, 0.2], PALETTE.deskLegs)
  box(group, [x + 2.8, 0, z + 1.8], [0.2, 2.2, 0.2], PALETTE.deskLegs)

  // Monitor
  box(group, [x + 0.8, 2.4, z + 1.2], [1.4, 1.0, 0.1], PALETTE.monitorFrame)
  const screen = box(group, [x + 0.9, 2.5, z + 1.19], [1.2, 0.8, 0.1], PALETTE.monitorScreen)
  // Monitor stand
  box(group, [x + 1.3, 2.4, z + 1.0], [0.4, 0.05, 0.4], PALETTE.monitorFrame)

  // Keyboard
  box(group, [x + 0.8, 2.42, z + 0.4], [1.2, 0.05, 0.4], PALETTE.keyboard)

  // Chair
  box(group, [x + 0.8, 0, z - 0.8], [1.4, 1.5, 0.1], PALETTE.chair)
  box(group, [x + 0.8, 1.5, z - 0.8], [1.4, 1.5, 0.1], PALETTE.chair)
  box(group, [x + 0.8, 1.4, z - 0.7], [1.4, 0.15, 1.0], PALETTE.chairSeat)

  return screen
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

function buildPlant(group: THREE.Group, x: number, z: number) {
  box(group, [x, 0, z], [0.6, 0.8, 0.6], PALETTE.plantPot)
  box(group, [x - 0.1, 0.8, z - 0.1], [0.8, 1.0, 0.8], PALETTE.plant)
}

export interface OfficeScene {
  group: THREE.Group
  buildLight: THREE.Mesh
  locations: NamedLocation[]
  screenMeshes: THREE.Mesh[]
}

export function createOffice(): OfficeScene {
  const group = new THREE.Group()
  const screenMeshes: THREE.Mesh[] = []

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
    screenMeshes.push(buildDesk(group, pos[0], pos[2]))
  }

  buildWhiteboard(group)
  const buildLight = buildBuildLight(group)
  buildCoffeeMachine(group)
  buildMeetingArea(group)

  // Decorative plants
  buildPlant(group, 0.5, 0.5)
  buildPlant(group, 23, 0.5)

  const locations: NamedLocation[] = [
    { name: 'desk_0', position: [3.5, 0, 1], seatDirection: [0, 0, 1] },
    { name: 'desk_1', position: [7.5, 0, 1], seatDirection: [0, 0, 1] },
    { name: 'desk_2', position: [15.5, 0, 1], seatDirection: [0, 0, 1] },
    { name: 'desk_3', position: [19.5, 0, 1], seatDirection: [0, 0, 1] },
    { name: 'coffee', position: [22, 0, 14] },
    { name: 'meeting', position: [3, 0, 13] },
    { name: 'whiteboard', position: [12, 0, 14] },
  ]

  return { group, buildLight, locations, screenMeshes }
}
