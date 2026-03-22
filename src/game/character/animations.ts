import type { CharacterMesh } from './mesh'

export type AnimationName = 'idle' | 'walk' | 'type' | 'talk' | 'drink' | 'stand' | 'sit'

const SPEED = 3

export function applyAnimation(character: CharacterMesh, animation: AnimationName, time: number) {
  const t = time * SPEED

  switch (animation) {
    case 'idle':
      // Subtle breathing
      character.body.position.y = 1.0 + Math.sin(t * 0.5) * 0.01
      character.leftArm.rotation.set(0, 0, 0)
      character.rightArm.rotation.set(0, 0, 0)
      character.leftLeg.rotation.x = 0
      character.rightLeg.rotation.x = 0
      character.head.rotation.x = 0
      character.head.rotation.y = Math.sin(t * 0.3) * 0.1
      break

    case 'walk':
      character.leftArm.rotation.set(Math.sin(t * 2) * 0.5, 0, 0)
      character.rightArm.rotation.set(-Math.sin(t * 2) * 0.5, 0, 0)
      character.leftLeg.rotation.x = -Math.sin(t * 2) * 0.4
      character.rightLeg.rotation.x = Math.sin(t * 2) * 0.4
      character.body.position.y = 1.0 + Math.abs(Math.sin(t * 2)) * 0.05
      character.head.rotation.set(0, 0, 0)
      break

    case 'type':
      // Seated typing - arms move quickly, small movements
      character.leftArm.rotation.x = -0.8 + Math.sin(t * 6) * 0.1
      character.rightArm.rotation.x = -0.8 + Math.sin(t * 6 + 1) * 0.1
      character.leftLeg.rotation.x = Math.PI / 2
      character.rightLeg.rotation.x = Math.PI / 2
      character.body.position.y = 0.6
      character.head.rotation.y = Math.sin(t * 0.2) * 0.05
      // Slight lean forward
      character.head.rotation.x = -0.1
      break

    case 'talk':
      // Gesticulating
      character.leftArm.rotation.x = -0.3 + Math.sin(t * 1.5) * 0.3
      character.rightArm.rotation.x = -0.3 + Math.sin(t * 1.5 + 2) * 0.3
      character.leftArm.rotation.z = Math.sin(t * 1.2) * 0.2
      character.rightArm.rotation.z = -Math.sin(t * 1.2 + 1) * 0.2
      character.leftLeg.rotation.x = 0
      character.rightLeg.rotation.x = 0
      character.body.position.y = 1.0
      character.head.rotation.y = Math.sin(t * 0.8) * 0.15
      character.head.rotation.x = 0
      break

    case 'drink':
      // One arm raised to mouth
      character.rightArm.rotation.x = -1.2
      character.rightArm.rotation.z = -0.3
      character.leftArm.rotation.x = 0
      character.leftArm.rotation.z = 0
      character.leftLeg.rotation.x = 0
      character.rightLeg.rotation.x = 0
      character.body.position.y = 1.0
      character.head.rotation.x = -0.15
      character.head.rotation.y = 0
      break

    case 'sit':
      // Seated idle — sitting in chair, not typing
      character.leftArm.rotation.set(-0.3, 0, 0)
      character.rightArm.rotation.set(-0.3, 0, 0)
      character.leftLeg.rotation.x = Math.PI / 2
      character.rightLeg.rotation.x = Math.PI / 2
      character.body.position.y = 0.6
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
      character.head.rotation.set(0, 0, 0)
      break
  }
}
