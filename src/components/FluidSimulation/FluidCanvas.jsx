import { useRef, useMemo } from 'react'
import { useFrame, useThree, createPortal, extend } from '@react-three/fiber'
import { useFBO, RenderTexture, Text } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import { FluidMaterial } from './FluidMaterial'
import { DistortionMaterial } from './DistortionMaterial'

extend({ FluidMaterial, DistortionMaterial })

export default function FluidCanvas() {
  const { size, gl, viewport } = useThree()

  // Leva panel pro doladění skleněného chování v reálném čase
  const config = useControls('BND Glass Engine', {
    decay: { value: 0.975, min: 0.95, max: 0.999, step: 0.001, label: 'Setrvačnost skla' },
    radius: { value: 0.08, min: 0.01, max: 0.3, step: 0.01, label: 'Velikost vln' },
    distortion: { value: 0.14, min: 0.01, max: 0.40, step: 0.01, label: 'Lom skla' },
    aberration: { value: 0.015, min: 0.001, max: 0.05, step: 0.001, label: 'Prism (Duhový efekt)' },
    shimmer: { value: 0.5, min: 0.0, max: 1.0, step: 0.1, label: 'Jiskření' },
    specularPower: { value: 48.0, min: 8.0, max: 128.0, step: 8.0, label: 'Ostrost odlesků' }
  })

  const fboWidth = size.width / 3
  const fboHeight = size.height / 3

  const fboConfig = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
  }

  const targetA = useRef(useFBO(fboWidth, fboHeight, fboConfig))
  const targetB = useRef(useFBO(fboWidth, fboHeight, fboConfig))
  const materialRef = useRef()
  const distortionRef = useRef()

  const pointer = useRef(new THREE.Vector2())
  const prevPointer = useRef(new THREE.Vector2())

  const orthoCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), [])
  const fboScene = useMemo(() => new THREE.Scene(), [])

  useFrame((state) => {
    prevPointer.current.copy(pointer.current)
    pointer.current.set((state.pointer.x + 1) / 2, (state.pointer.y + 1) / 2)

    if (materialRef.current) {
      materialRef.current.uniforms.uTexture.value = targetA.current.texture
      materialRef.current.uniforms.uMouse.value.copy(pointer.current)
      materialRef.current.uniforms.uPrevMouse.value.copy(prevPointer.current)
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height)
      materialRef.current.uniforms.uDecay.value = config.decay
      materialRef.current.uniforms.uRadius.value = config.radius
    }

    gl.setRenderTarget(targetB.current)
    gl.render(fboScene, orthoCamera)
    gl.setRenderTarget(null)

    const temp = targetA.current
    targetA.current = targetB.current
    targetB.current = temp

    if (distortionRef.current) {
      distortionRef.current.uniforms.uFluidTex.value = targetB.current.texture
      distortionRef.current.uniforms.uDistortionStrength.value = config.distortion
      distortionRef.current.uniforms.uAberrationStrength.value = config.aberration
      distortionRef.current.uniforms.uSpecularPower.value = config.specularPower
      distortionRef.current.uniforms.uShimmerIntensity.value = config.shimmer
      distortionRef.current.uniforms.uTime.value = state.clock.elapsedTime * 10.0
    }
  })

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
          <fluidMaterial ref={materialRef} />
        </mesh>,
        fboScene
      )}

      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <distortionMaterial ref={distortionRef}>
          <RenderTexture attach="uTextTex">
            {/* PRÉMIOVÁ ŠEDÁ: Pozadí studia, které dává vyniknout stříbrným odleskům */}
            <color attach="background" args={['#e5e5e7']} />
            
            <Text
              position={[0, 0, 0]}
              fontSize={viewport.width * 0.09}
              fontWeight={900}
              anchorX="center"
              anchorY="middle"
              color="#1a1a1a"
            >
              BND AGENCY
            </Text>
          </RenderTexture>
        </distortionMaterial>
      </mesh>
    </>
  )
}