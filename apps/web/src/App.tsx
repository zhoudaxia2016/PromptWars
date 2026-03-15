import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Cubic from './pages/Cubic';
import Crossword from './pages/Crossword';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cubic" element={<Cubic />} />
      <Route path="/crossword" element={<Crossword />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
