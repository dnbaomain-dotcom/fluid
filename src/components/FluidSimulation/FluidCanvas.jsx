import { useRef, useMemo } from 'react'
import { useFrame, useThree, createPortal, extend } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import * as THREE from 'three'
import { FluidMaterial } from './FluidMaterial'
import { SkyGlassMaterial } from './SkyGlassMaterial'

extend({ FluidMaterial, SkyGlassMaterial })

export default function FluidCanvas({ fluidSettings = {}, glassSettings = {} }) {
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
  
  const prevPointer = useRef(new THREE.Vector2())
  const currentPointer = useRef(new THREE.Vector2())

  useFrame((state) => {
    prevPointer.current.copy(currentPointer.current)
    currentPointer.current.set((pointer.x + 1) / 2, (pointer.y + 1) / 2)

    // Výpočet fluidní hybnosti (FBO Ping-Pong)
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

    // Předání dat do snového skleněného shaderu
    if (skyMaterialRef.current) {
      skyMaterialRef.current.uFluidTex = targetB.current.texture
      skyMaterialRef.current.uTime = state.clock.getElapsedTime()
      skyMaterialRef.current.uDistortion = distortion
      skyMaterialRef.current.uAberration = aberration
      skyMaterialRef.current.uFogStrength = fogStrength
      skyMaterialRef.current.uHighlight = highlight
      skyMaterialRef.current.uSkyColor1 = skyColor1Vec
      skyMaterialRef.current.uSkyColor2 = skyColor2Vec
      skyMaterialRef.current.uCloudColor = cloudColorVec
    }
  })

  return (
    <>
      {/* Skrytá scéna, kde se počítají vlny myši */}
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

      {/* Fullscreen plátno: Tady se vykresluje nebe, mlha a tekuté sklo */}
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        {/* @ts-ignore */}
        <skyGlassMaterial
          ref={skyMaterialRef}
          uDistortion={distortion}
          uAberration={aberration}
          uFogStrength={fogStrength}
          uHighlight={highlight}
          uSkyColor1={skyColor1Vec}
          uSkyColor2={skyColor2Vec}
          uCloudColor={cloudColorVec}
        />
      </mesh>
    </>
  )
}