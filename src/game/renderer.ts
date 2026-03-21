import * as THREE from 'three'
import { createOffice, type OfficeScene } from './office'
import { PALETTE } from './palette'
import type { CIStatus } from './types'

export interface GameRenderer {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  office: OfficeScene
  start(): void
  stop(): void
  addToScene(obj: THREE.Object3D): void
  removeFromScene(obj: THREE.Object3D): void
  setBuildLight(status: CIStatus): void
  setScreenGlow(active: boolean): void
  onFrame(callback: (dt: number) => void): void
  applyPanDeltaPixels(dx: number, dy: number): void
  applyZoomScale(factor: number): void
  applyRotationDelta(deltaRadians: number): void
  resetCamera(): void
  canvas: HTMLCanvasElement
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function createRenderer(canvas: HTMLCanvasElement): GameRenderer {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#1a1a2e')

  // Orthographic camera
  const aspect = canvas.clientHeight > 0 ? canvas.clientWidth / canvas.clientHeight : 16 / 9
  const BASE_FRUSTUM = 14

  const camera = new THREE.OrthographicCamera(
    -BASE_FRUSTUM * aspect,
    BASE_FRUSTUM * aspect,
    BASE_FRUSTUM,
    -BASE_FRUSTUM,
    0.1,
    100,
  )

  // Isometric-ish view — base position & lookAt target
  const BASE_POSITION = new THREE.Vector3(20, 18, -8)
  const BASE_LOOKAT = new THREE.Vector3(12, 0, 8)
  // Offset from lookAt to camera position (kept constant during pan)
  const cameraOffset = BASE_POSITION.clone().sub(BASE_LOOKAT)

  // Pan / zoom / rotation state
  let zoomScale = 1
  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 4
  let panWorldX = 0
  let panWorldY = 0
  const MAX_PAN = 20
  let rotationY = 0 // radians around Y axis

  // Camera's right and up vectors in world space (for mapping screen pan to world)
  const cameraRight = new THREE.Vector3()
  const cameraUp = new THREE.Vector3()
  const _yAxis = new THREE.Vector3(0, 1, 0)
  // Reusable temp vectors to avoid per-frame allocations
  const _rotatedOffset = new THREE.Vector3()
  const _panOffset = new THREE.Vector3()
  const _lookAt = new THREE.Vector3()

  function applyPanZoom(): void {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return
    const a = w / h
    const frustum = BASE_FRUSTUM / zoomScale

    camera.left = -frustum * a
    camera.right = frustum * a
    camera.top = frustum
    camera.bottom = -frustum

    // Rotate the camera offset around Y axis
    _rotatedOffset.copy(cameraOffset).applyAxisAngle(_yAxis, rotationY)

    // Place camera at rotated position to extract right/up vectors
    camera.position.copy(BASE_LOOKAT).add(_rotatedOffset)
    camera.lookAt(BASE_LOOKAT)
    camera.updateMatrixWorld()
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0)
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1)

    // Apply pan offset in camera-local space
    _panOffset
      .set(0, 0, 0)
      .addScaledVector(cameraRight, panWorldX)
      .addScaledVector(cameraUp, panWorldY)

    _lookAt.copy(BASE_LOOKAT).add(_panOffset)
    camera.position.copy(_lookAt).add(_rotatedOffset)
    camera.lookAt(_lookAt)
    camera.updateProjectionMatrix()
  }

  camera.position.copy(BASE_POSITION)
  camera.lookAt(BASE_LOOKAT)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Lighting
  const ambient = new THREE.AmbientLight('#ffffff', 0.6)
  scene.add(ambient)

  const directional = new THREE.DirectionalLight('#ffffff', 0.8)
  directional.position.set(10, 15, -5)
  directional.castShadow = true
  directional.shadow.mapSize.setScalar(1024)
  directional.shadow.camera.near = 0.5
  directional.shadow.camera.far = 50
  directional.shadow.camera.left = -20
  directional.shadow.camera.right = 20
  directional.shadow.camera.top = 20
  directional.shadow.camera.bottom = -20
  scene.add(directional)

  // Subtle colored fill light
  const fill = new THREE.DirectionalLight('#4a90d9', 0.2)
  fill.position.set(-5, 8, 10)
  scene.add(fill)

  // Build the office
  const office = createOffice()
  scene.add(office.group)

  let running = false
  let animId = 0
  let lastTime = 0
  let frameCallback: ((dt: number) => void) | null = null

  function animate(time: number) {
    if (!running) return
    const dt = lastTime === 0 ? 0.016 : (time - lastTime) / 1000
    lastTime = time

    if (frameCallback) frameCallback(Math.min(dt, 0.1))
    renderer.render(scene, camera)
    animId = requestAnimationFrame(animate)
  }

  // Handle resize
  function onResize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return
    renderer.setSize(w, h)
    applyPanZoom()
  }
  window.addEventListener('resize', onResize)

  return {
    scene,
    camera,
    renderer,
    office,

    start() {
      running = true
      lastTime = 0
      animId = requestAnimationFrame(animate)
    },

    stop() {
      running = false
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)

      // Dispose all geometries and materials to free VRAM
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })

      renderer.dispose()
    },

    addToScene(obj: THREE.Object3D) {
      scene.add(obj)
    },

    removeFromScene(obj: THREE.Object3D) {
      scene.remove(obj)
    },

    setBuildLight(status: CIStatus) {
      const mat = office.buildLight.material as THREE.MeshLambertMaterial
      switch (status) {
        case 'green':
          mat.color.set(PALETTE.buildGreen)
          break
        case 'red':
          mat.color.set(PALETTE.buildRed)
          break
        case 'building':
          mat.color.set(PALETTE.buildYellow)
          break
      }
    },

    setScreenGlow(active: boolean) {
      for (const screen of office.screenMeshes) {
        const mat = screen.material as THREE.MeshLambertMaterial
        mat.color.set(active ? PALETTE.monitorScreenGlow : PALETTE.monitorScreen)
        mat.emissive.set(active ? PALETTE.monitorScreenGlow : '#000000')
        mat.emissiveIntensity = active ? 0.3 : 0
      }
    },

    onFrame(callback: (dt: number) => void) {
      frameCallback = callback
    },

    applyPanDeltaPixels(dx: number, dy: number) {
      const frustum = BASE_FRUSTUM / zoomScale
      const a = canvas.clientHeight > 0 ? canvas.clientWidth / canvas.clientHeight : 16 / 9
      const visibleW = frustum * a * 2
      const visibleH = frustum * 2
      const unitsPerPixelX = visibleW / canvas.clientWidth
      const unitsPerPixelY = visibleH / canvas.clientHeight
      panWorldX -= dx * unitsPerPixelX
      panWorldY += dy * unitsPerPixelY
      panWorldX = clamp(panWorldX, -MAX_PAN, MAX_PAN)
      panWorldY = clamp(panWorldY, -MAX_PAN, MAX_PAN)
      applyPanZoom()
    },

    applyZoomScale(factor: number) {
      zoomScale = clamp(zoomScale * factor, MIN_ZOOM, MAX_ZOOM)
      applyPanZoom()
    },

    applyRotationDelta(deltaRadians: number) {
      rotationY += deltaRadians
      applyPanZoom()
    },

    resetCamera() {
      zoomScale = 1
      panWorldX = 0
      panWorldY = 0
      rotationY = 0
      applyPanZoom()
    },

    canvas,
  }
}
