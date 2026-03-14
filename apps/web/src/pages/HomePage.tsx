import { Link } from 'react-router-dom';

const entries = [
  {
    to: '/cubic',
    title: '3D 魔方',
    desc: '标准三阶魔方 · 拖拽旋转 · WCA 打乱 · CFOP 公式',
    icon: 'cube',
    accent: '#ffd966',
  },
  {
    to: '/crossword',
    title: '日语填字',
    desc: '横向纵向日语单词 · 罗马音输入 · 平假名显示',
    icon: 'grid',
    accent: '#e94560',
  },
];

export default function HomePage() {
  return (
    <div style={containerStyle}>
      <style>{`
        .home-card:focus-visible { box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 2px #ffd966 !important; }
      `}</style>
      <div style={bgPattern} aria-hidden />
      <main style={mainStyle}>
        <h1 style={titleStyle}>PromptWars</h1>
        <p style={subtitleStyle}>AI 辅助的趣味小工具</p>
        <nav style={navStyle}>
          {entries.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="home-card"
              style={cardStyle(item.accent)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${item.accent}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
              }}
            >
              <span style={iconStyle}>
                {item.icon === 'cube' && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                )}
                {item.icon === 'grid' && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                )}
              </span>
              <h2 style={cardTitleStyle}>{item.title}</h2>
              <p style={cardDescStyle}>{item.desc}</p>
              <span style={arrowStyle}>→</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #0a0a12 0%, #12121a 40%, #0d1117 100%)',
  position: 'relative',
  overflow: 'hidden',
};

const bgPattern: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    radial-gradient(circle at 20% 30%, rgba(255,217,102,0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(170,204,255,0.05) 0%, transparent 50%),
    linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 100%)
  `,
  pointerEvents: 'none',
};

const mainStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  padding: 48,
  maxWidth: 720,
  margin: '0 auto',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  fontWeight: 700,
  color: '#fff',
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 40px',
  fontSize: 15,
  color: 'rgba(255,255,255,0.5)',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  width: '100%',
};

const cardStyle = (accent: string): React.CSSProperties => ({
  display: 'block',
  padding: '24px 28px',
  background: 'rgba(20,20,30,0.8)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  textDecoration: 'none',
  color: 'inherit',
  transition: 'transform 0.2s, box-shadow 0.2s',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  position: 'relative',
  outline: 'none',
});

const iconStyle: React.CSSProperties = {
  fontSize: 32,
  display: 'block',
  marginBottom: 12,
  color: 'rgba(255,255,255,0.9)',
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: 20,
  fontWeight: 600,
  color: '#fff',
};

const cardDescStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: 'rgba(255,255,255,0.55)',
  lineHeight: 1.5,
};

const arrowStyle: React.CSSProperties = {
  position: 'absolute',
  right: 24,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 20,
  color: 'rgba(255,255,255,0.3)',
};
