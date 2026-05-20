import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import Overlay from './components/Overlay'
import FluidCanvas from './components/FluidSimulation/FluidCanvas'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Konfigurace Leva panelu na levou stranu s tmavým tématem */}
      <Leva 
        theme={{
          sizes: { panelWidth: '280px', rootTop: '70px', rootLeft: '20px' },
          colors: { elevation1: '#ffffff', elevation2: '#f5f5f5', accentColor: '#1a1a1a', label: '#333', value: '#000' }
        }}
        oneLineLabels={true}
        flat={true}
      />

      <Overlay />

      <Canvas
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 1] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
      >
        {/* Sladěné pozadí Canvasu */}
        <color attach="background" args={['#e5e5e7']} />
        <FluidCanvas />
      </Canvas>
    </div>
  )
}