import { Link } from 'react-router-dom';
import s from './index.module.less';

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

export default function Home() {
  return (
    <div className={s.homePage}>
      <div className={s.bgPattern} aria-hidden />
      <main className={s.main}>
        <h1 className={s.title}>PromptWars</h1>
        <p className={s.subtitle}>AI 辅助的趣味小工具</p>
        <nav className={s.nav}>
          {entries.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={s.homeCard}
              style={
                {
                  '--accent': item.accent,
                  '--accent-border': item.accent + '40',
                } as React.CSSProperties
              }
            >
              <span className={s.cardIcon}>
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
              <h2 className={s.cardTitle}>{item.title}</h2>
              <p className={s.cardDesc}>{item.desc}</p>
              <span className={s.cardArrow}>→</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
