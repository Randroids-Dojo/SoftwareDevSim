import * as THREE from 'three'
import { PALETTE } from '../palette'

export interface CharacterMesh {
  root: THREE.Group
  head: THREE.Group
  body: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
}

function voxel(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: string,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshLambertMaterial({ color })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  parent.add(mesh)
  return mesh
}

export function createCharacterMesh(colorIndex: number): CharacterMesh {
  const root = new THREE.Group()

  const shirtColor = PALETTE.shirt[colorIndex % PALETTE.shirt.length]
  const hairColor = PALETTE.hair[colorIndex % PALETTE.hair.length]

  // Head group (pivot at neck)
  const head = new THREE.Group()
  head.position.set(0, 1.8, 0)
  voxel(head, 0, 0.3, 0, 0.5, 0.5, 0.5, PALETTE.skin)
  // Hair
  voxel(head, 0, 0.6, 0.02, 0.52, 0.15, 0.52, hairColor)
  // Eyes
  voxel(head, -0.12, 0.3, -0.26, 0.08, 0.08, 0.02, '#1a1a1a')
  voxel(head, 0.12, 0.3, -0.26, 0.08, 0.08, 0.02, '#1a1a1a')
  root.add(head)

  // Body
  const body = new THREE.Group()
  body.position.set(0, 1.0, 0)
  voxel(body, 0, 0.35, 0, 0.6, 0.7, 0.35, shirtColor)
  root.add(body)

  // Left arm (pivot at shoulder)
  const leftArm = new THREE.Group()
  leftArm.position.set(-0.45, 1.65, 0)
  voxel(leftArm, 0, -0.35, 0, 0.2, 0.6, 0.2, shirtColor)
  voxel(leftArm, 0, -0.7, 0, 0.18, 0.15, 0.18, PALETTE.skin)
  root.add(leftArm)

  // Right arm (pivot at shoulder)
  const rightArm = new THREE.Group()
  rightArm.position.set(0.45, 1.65, 0)
  voxel(rightArm, 0, -0.35, 0, 0.2, 0.6, 0.2, shirtColor)
  voxel(rightArm, 0, -0.7, 0, 0.18, 0.15, 0.18, PALETTE.skin)
  root.add(rightArm)

  // Left leg (pivot at hip)
  const leftLeg = new THREE.Group()
  leftLeg.position.set(-0.15, 0.65, 0)
  voxel(leftLeg, 0, -0.3, 0, 0.22, 0.55, 0.25, PALETTE.pants)
  voxel(leftLeg, 0, -0.6, 0, 0.22, 0.1, 0.3, PALETTE.shoes)
  root.add(leftLeg)

  // Right leg (pivot at hip)
  const rightLeg = new THREE.Group()
  rightLeg.position.set(0.15, 0.65, 0)
  voxel(rightLeg, 0, -0.3, 0, 0.22, 0.55, 0.25, PALETTE.pants)
  voxel(rightLeg, 0, -0.6, 0, 0.22, 0.1, 0.3, PALETTE.shoes)
  root.add(rightLeg)

  return { root, head, body, leftArm, rightArm, leftLeg, rightLeg }
}
