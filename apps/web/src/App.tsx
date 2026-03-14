import { Routes, Route, Navigate, Link } from 'react-router-dom';
import CubicPage from './pages/CubicPage';
import CrosswordPage from './pages/CrosswordPage';

function Home() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>PromptWars</h1>
      <nav style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <Link to="/cubic">3D 魔方</Link>
        <Link to="/crossword">日语填字</Link>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cubic" element={<CubicPage />} />
      <Route path="/crossword" element={<CrosswordPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
