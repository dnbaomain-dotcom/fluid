export default function Overlay() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2rem',
      pointerEvents: 'none',
      zIndex: 10
    }}>
      {/* Navigace - zůstává funkční a klikatelná */}
      <header style={{ display: 'flex', justifyContent: 'space-between', width: '100%', pointerEvents: 'auto' }}>
        <div style={{ fontWeight: 'bold', letterSpacing: '2px' }}>BND.</div>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <a href="#projects" style={{ color: '#000', textDecoration: 'none', fontSize: '0.9rem' }}>PROJEKTY</a>
          <a href="#about" style={{ color: '#000', textDecoration: 'none', fontSize: '0.9rem' }}>O NÁS</a>
          <a href="#contact" style={{ color: '#000', textDecoration: 'none', fontSize: '0.9rem' }}>KONTAKT</a>
        </nav>
      </header>

      {/* Footer */}
      <footer style={{ fontSize: '0.8rem', color: '#444' }}>
        © 2026 BND AGENCY. ALL RIGHTS RESERVED.
      </footer>
    </div>
  )
}