import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CubicPage from './pages/CubicPage';
import CrosswordPage from './pages/crossword';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cubic" element={<CubicPage />} />
      <Route path="/crossword" element={<CrosswordPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
