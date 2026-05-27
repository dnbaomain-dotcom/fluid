import { useRef, useMemo } from 'react'
import { useFrame, useThree, createPortal, extend } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import * as THREE from 'three'
import { FluidMaterial } from './FluidMaterial'
import { SkyGlassMaterial } from './SkyGlassMaterial'
import { PrismGlassMaterial } from './PrismGlassMaterial'
import { NeonGlassMaterial } from './NeonGlassMaterial'

extend({ FluidMaterial, SkyGlassMaterial, PrismGlassMaterial, NeonGlassMaterial })

export default function FluidCanvas({ fluidSettings = {}, glassSettings = {}, materialSettings = {} }) {
  const { size, gl, viewport, pointer } = useThree()

  const {
    decay = 0.96,
    radius = 0.04,
    force = 8.0,
    advection = 0.005,
  } = fluidSettings

  const {
    distortion = 0.15,
    aberration = 0.02,
    fogStrength = 0.4,
    highlight = 3.0,
    skyColor1 = '#76d4ff',
    skyColor2 = '#f9d2dc',
    cloudColor = '#ffffff',
  } = glassSettings

  const {
    materialType = 'sky',
    materialDistortion = 0.15,
    materialAberration = 0.02,
    materialGlow = 3.0,
    prismColor1 = '#76d4ff',
    prismColor2 = '#ffb2f6',
    neonGridScale = 5.0,
    neonPulse = 1.0,
    neonHue = 0.62,
  } = materialSettings

  const fboConfig = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter }
  const targetA = useRef(useFBO(size.width / 4, size.height / 4, fboConfig))
  const targetB = useRef(useFBO(size.width / 4, size.height / 4, fboConfig))
  
  const fluidMaterialRef = useRef(null)
  const skyMaterialRef = useRef(null)
  
  const fboScene = useMemo(() => new THREE.Scene(), [])
  const orthoCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), [])

  const skyColor1Vec = useMemo(() => new THREE.Color(skyColor1), [skyColor1])
  const skyColor2Vec = useMemo(() => new THREE.Color(skyColor2), [skyColor2])
  const cloudColorVec = useMemo(() => new THREE.Color(cloudColor), [cloudColor])
  const prismColor1Vec = useMemo(() => new THREE.Color(prismColor1), [prismColor1])
  const prismColor2Vec = useMemo(() => new THREE.Color(prismColor2), [prismColor2])
  const neonColorVec = useMemo(() => new THREE.Color().setHSL(neonHue, 0.95, 0.58), [neonHue])
  
  const prevPointer = useRef(new THREE.Vector2())
  const currentPointer = useRef(new THREE.Vector2())

  useFrame((state) => {
    prevPointer.current.copy(currentPointer.current)
    currentPointer.current.set((pointer.x + 1) / 2, (pointer.y + 1) / 2)

    if (fluidMaterialRef.current) {
      fluidMaterialRef.current.uTexture = targetA.current.texture
      fluidMaterialRef.current.uMouse.copy(currentPointer.current)
      fluidMaterialRef.current.uPrevMouse.copy(prevPointer.current)
      fluidMaterialRef.current.uResolution.set(size.width, size.height)
      fluidMaterialRef.current.uDecay = decay
      fluidMaterialRef.current.uRadius = radius
      fluidMaterialRef.current.uForce = force
      fluidMaterialRef.current.uAdvection = advection
    }

    gl.setRenderTarget(targetB.current)
    gl.render(fboScene, orthoCamera)
    gl.setRenderTarget(null)

    const temp = targetA.current
    targetA.current = targetB.current
    targetB.current = temp

    if (skyMaterialRef.current) {
      const mat = skyMaterialRef.current
      mat.uFluidTex = targetB.current.texture
      mat.uTime = state.clock.getElapsedTime()
      mat.uDistortion = materialDistortion
      mat.uAberration = materialAberration
      mat.uGlow = materialGlow

      if (mat.uFogStrength !== undefined) mat.uFogStrength = fogStrength
      if (mat.uHighlight !== undefined) mat.uHighlight = highlight
      if (mat.uSkyColor1 !== undefined) mat.uSkyColor1 = skyColor1Vec
      if (mat.uSkyColor2 !== undefined) mat.uSkyColor2 = skyColor2Vec
      if (mat.uCloudColor !== undefined) mat.uCloudColor = cloudColorVec
      if (mat.uColor1 !== undefined) mat.uColor1 = prismColor1Vec
      if (mat.uColor2 !== undefined) mat.uColor2 = prismColor2Vec
      if (mat.uGridScale !== undefined) mat.uGridScale = neonGridScale
      if (mat.uPulseSpeed !== undefined) mat.uPulseSpeed = neonPulse
      if (mat.uHue !== undefined) mat.uHue = neonHue
    }
  })

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
          {/* @ts-ignore */}
          <fluidMaterial
            ref={fluidMaterialRef}
            uDecay={decay}
            uRadius={radius}
            uForce={force}
            uAdvection={advection}
          />
        </mesh>,
        fboScene
      )}

      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        {materialType === 'prism' && (
          // @ts-ignore
          <prismGlassMaterial
            ref={skyMaterialRef}
            uDistortion={materialDistortion}
            uAberration={materialAberration}
            uGlow={materialGlow}
            uColor1={prismColor1Vec}
            uColor2={prismColor2Vec}
          />
        )}
        {materialType === 'neon' && (
          // @ts-ignore
          <neonGlassMaterial
            ref={skyMaterialRef}
            uGridScale={neonGridScale}
            uPulseSpeed={neonPulse}
            uGlow={materialGlow}
            uHue={neonHue}
          />
        )}
        {materialType === 'sky' && (
          // @ts-ignore
          <skyGlassMaterial
            ref={skyMaterialRef}
            uDistortion={materialDistortion}
            uAberration={materialAberration}
            uFogStrength={fogStrength}
            uHighlight={highlight}
            uSkyColor1={skyColor1Vec}
            uSkyColor2={skyColor2Vec}
            uCloudColor={cloudColorVec}
          />
        )}
      </mesh>
    </>
  )
}
