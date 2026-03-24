/**
 * Semantic direction constants for character limb rotations.
 *
 * The character mesh faces -Z, but Math.PI is added to root.rotation.y
 * at runtime (see developer.ts syncMeshPosition). This flips the
 * effective direction of X-axis and Z-axis rotations. These constants
 * encode the correct sign so animation code reads as intent, not math.
 */

// --- Arm / Leg rotation.x (forward / backward) ---
/** Positive X = toward desk (forward) */
export const ARM_FORWARD = 1
/** Negative X = away from desk (backward) */
export const ARM_BACKWARD = -1

// --- Arm rotation.z (inward / outward) ---
/** Left arm: positive Z = inward (toward body) */
export const LEFT_ARM_INWARD = 1
/** Left arm: negative Z = outward (away from body) */
export const LEFT_ARM_OUTWARD = -1
/** Right arm: negative Z = inward (toward body) */
export const RIGHT_ARM_INWARD = -1
/** Right arm: positive Z = outward (away from body) */
export const RIGHT_ARM_OUTWARD = 1

// --- Leg rotation.x (forward / backward) ---
/** Positive X = bend forward (toward desk, for sitting) */
export const LEG_FORWARD = 1
/** Negative X = swing backward */
export const LEG_BACKWARD = -1

// --- Head rotation.x (tilt) ---
/** Negative X = look down toward desk */
export const HEAD_TILT_DOWN = -1

// --- Common poses ---
/** Standard seated leg bend (90 degrees forward) */
export const SEATED_LEG_BEND = LEG_FORWARD * (Math.PI / 2)
