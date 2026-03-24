import type { CharacterMesh } from './mesh'
import {
  ARM_BACKWARD,
  ARM_FORWARD,
  HEAD_TILT_DOWN,
  LEFT_ARM_INWARD,
  LEFT_ARM_OUTWARD,
  LEG_BACKWARD,
  LEG_FORWARD,
  RIGHT_ARM_INWARD,
  RIGHT_ARM_OUTWARD,
  SEATED_LEG_BEND,
} from './rotationHelpers'

export type AnimationName = 'idle' | 'walk' | 'type' | 'talk' | 'drink' | 'stand' | 'sit'

const SPEED = 3

export function applyAnimation(character: CharacterMesh, animation: AnimationName, time: number) {
  const t = time * SPEED

  switch (animation) {
    case 'idle':
      // Subtle breathing
      character.body.position.y = 1.0 + Math.sin(t * 0.5) * 0.01
      character.head.position.y = 1.8
      character.leftArm.position.y = 1.65
      character.rightArm.position.y = 1.65
      character.leftArm.rotation.set(0, 0, 0)
      character.rightArm.rotation.set(0, 0, 0)
      character.leftLeg.rotation.x = 0
      character.rightLeg.rotation.x = 0
      character.head.rotation.x = 0
      character.head.rotation.y = Math.sin(t * 0.3) * 0.1
      break

    case 'walk':
      // Natural gait: left arm + right leg forward, then swap
      character.leftArm.rotation.set(ARM_FORWARD * Math.sin(t * 2) * 0.5, 0, 0)
      character.rightArm.rotation.set(ARM_BACKWARD * Math.sin(t * 2) * 0.5, 0, 0)
      character.leftLeg.rotation.x = LEG_BACKWARD * Math.sin(t * 2) * 0.4
      character.rightLeg.rotation.x = LEG_FORWARD * Math.sin(t * 2) * 0.4
      character.body.position.y = 1.0 + Math.abs(Math.sin(t * 2)) * 0.05
      character.head.position.y = 1.8
      character.leftArm.position.y = 1.65
      character.rightArm.position.y = 1.65
      character.head.rotation.set(0, 0, 0)
      break

    case 'type':
      // Seated typing — arms reach forward and inward to keyboard homerow
      character.leftArm.rotation.set(
        ARM_FORWARD * (1.0 + Math.sin(t * 6) * 0.1),
        0,
        LEFT_ARM_INWARD * 0.35,
      )
      character.rightArm.rotation.set(
        ARM_FORWARD * (1.0 + Math.sin(t * 6 + 1) * 0.1),
        0,
        RIGHT_ARM_INWARD * 0.35,
      )
      character.leftLeg.rotation.x = SEATED_LEG_BEND
      character.rightLeg.rotation.x = SEATED_LEG_BEND
      character.body.position.y = 0.7
      character.head.position.y = 1.5
      character.leftArm.position.y = 1.35
      character.rightArm.position.y = 1.35
      character.head.rotation.y = Math.sin(t * 0.2) * 0.05
      character.head.rotation.x = HEAD_TILT_DOWN * 0.1
      break

    case 'talk':
      // Gesticulating — arms swing forward with outward flourishes
      character.leftArm.rotation.x = ARM_FORWARD * (0.3 + Math.sin(t * 1.5) * 0.3)
      character.rightArm.rotation.x = ARM_FORWARD * (0.3 + Math.sin(t * 1.5 + 2) * 0.3)
      character.leftArm.rotation.z = LEFT_ARM_OUTWARD * Math.sin(t * 1.2) * 0.2
      character.rightArm.rotation.z = RIGHT_ARM_OUTWARD * Math.sin(t * 1.2 + 1) * 0.2
      character.leftLeg.rotation.x = 0
      character.rightLeg.rotation.x = 0
      character.body.position.y = 1.0
      character.head.position.y = 1.8
      character.leftArm.position.y = 1.65
      character.rightArm.position.y = 1.65
      character.head.rotation.y = Math.sin(t * 0.8) * 0.15
      character.head.rotation.x = 0
      break

    case 'drink':
      // Right arm raised to mouth, tilted outward to tip cup
      character.rightArm.rotation.x = ARM_FORWARD * 1.2
      character.rightArm.rotation.z = RIGHT_ARM_OUTWARD * 0.3
      character.leftArm.rotation.x = 0
      character.leftArm.rotation.z = 0
      character.leftLeg.rotation.x = 0
      character.rightLeg.rotation.x = 0
      character.body.position.y = 1.0
      character.head.position.y = 1.8
      character.leftArm.position.y = 1.65
      character.rightArm.position.y = 1.65
      character.head.rotation.x = HEAD_TILT_DOWN * 0.15
      character.head.rotation.y = 0
      break

    case 'sit':
      // Seated idle — sitting in chair, arms slightly forward
      character.leftArm.rotation.set(ARM_FORWARD * 0.3, 0, 0)
      character.rightArm.rotation.set(ARM_FORWARD * 0.3, 0, 0)
      character.leftLeg.rotation.x = SEATED_LEG_BEND
      character.rightLeg.rotation.x = SEATED_LEG_BEND
      character.body.position.y = 0.7
      character.head.position.y = 1.5
      character.leftArm.position.y = 1.35
      character.rightArm.position.y = 1.35
      character.head.rotation.x = 0
      character.head.rotation.y = Math.sin(t * 0.3) * 0.1
      break

    case 'stand':
      // Neutral standing pose
      character.leftArm.rotation.set(0, 0, 0)
      character.rightArm.rotation.set(0, 0, 0)
      character.leftLeg.rotation.set(0, 0, 0)
      character.rightLeg.rotation.set(0, 0, 0)
      character.body.position.y = 1.0
      character.head.position.y = 1.8
      character.leftArm.position.y = 1.65
      character.rightArm.position.y = 1.65
      character.head.rotation.set(0, 0, 0)
      break
  }
}
