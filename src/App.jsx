import { Canvas } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import Overlay from './components/Overlay'
import FluidCanvas from './components/FluidSimulation/FluidCanvas'

export default function App() {
  const fluidSettings = useControls('Fluid', {
    decay: { value: 0.96, min: 0.7, max: 1.0, step: 0.005 },
    radius: { value: 0.04, min: 0.01, max: 0.2, step: 0.005 },
    force: { value: 8.0, min: 0.0, max: 20.0, step: 0.25 },
    advection: { value: 0.005, min: 0.0, max: 0.02, step: 0.0005 },
  })

  const glassSettings = useControls('Glass', {
    distortion: { value: 0.15, min: 0.0, max: 0.4, step: 0.005 },
    aberration: { value: 0.02, min: 0.0, max: 0.12, step: 0.002 },
    fogStrength: { value: 0.4, min: 0.0, max: 1.0, step: 0.01 },
    highlight: { value: 3.0, min: 0.0, max: 10.0, step: 0.1 },
    skyColor1: '#76d4ff',
    skyColor2: '#f9d2dc',
    cloudColor: '#ffffff',
  })

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Konfigurace Leva panelu na levou stranu s tmavým tématem */}
      <Leva 
        theme={{
          sizes: { panelWidth: '300px', rootTop: '70px', rootLeft: '20px' },
          colors: { elevation1: '#ffffff', elevation2: '#f7f7f7', accentColor: '#1a1a1a', label: '#333', value: '#000' }
        }}
        oneLineLabels={true}
        flat={true}
      />

      <Overlay />

      <Canvas
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 1] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
      >
        {/* Sladěné pozadí Canvasu */}
        <color attach="background" args={['#e5e5e7']} />
        <FluidCanvas fluidSettings={fluidSettings} glassSettings={glassSettings} />
      </Canvas>
    </div>
  )
}