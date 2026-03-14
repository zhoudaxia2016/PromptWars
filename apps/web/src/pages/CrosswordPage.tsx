import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PUZZLE, buildGrid, ROMA_TO_HIRA } from '@promptwars/crossword';

export default function CrosswordPage() {
  const { grid, cellWords } = useMemo(() => buildGrid(PUZZLE), []);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [currentWord, setCurrentWord] = useState<{ word: (typeof PUZZLE.words)[0]; index: number } | null>(null);
  const [userInput, setUserInput] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [checkResult, setCheckResult] = useState<Record<string, 'correct' | 'wrong'> | null>(null);

  const selectCell = useCallback((r: number, c: number) => {
    const cell = grid[r]?.[c];
    if (!cell) return;

    const key = `${r},${c}`;
    const words = cellWords[key];
    if (!words) return;

    const word = PUZZLE.words.find((w) => w.id === words[0].id);
    if (!word) return;

    setSelectedCell({ r, c });
    setCurrentWord({ word, index: words[0].index });
  }, [grid, cellWords]);

  const getHighlightedCells = useCallback(() => {
    if (!currentWord) return new Set<string>();
    const s = new Set<string>();
    const ans = currentWord.word.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const r = currentWord.word.dir === 'across' ? currentWord.word.row : currentWord.word.row + i;
      const c = currentWord.word.dir === 'across' ? currentWord.word.col + i : currentWord.word.col;
      s.add(`${r},${c}`);
    }
    return s;
  }, [currentWord]);

  const highlighted = getHighlightedCells();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell) return;
      const { r, c } = selectedCell;
      const key = `${r},${c}`;

      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        const char = e.key.toLowerCase();
        setUserInput((prev) => ({ ...prev, [key]: char }));
        moveToNext(r, c);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setUserInput((prev) => ({ ...prev, [key]: '' }));
        moveToPrev(r, c);
      }
    },
    [selectedCell]
  );

  const moveToNext = (r: number, c: number) => {
    const words = PUZZLE.words.filter((w) => {
      const ans = w.answer.replace(/\s/g, '');
      for (let i = 0; i < ans.length; i++) {
        const rr = w.dir === 'across' ? w.row : w.row + i;
        const cc = w.dir === 'across' ? w.col + i : w.col;
        if (rr === r && cc === c) return true;
      }
      return false;
    });
    if (!words.length) return;
    const w = words[0];
    const ans = w.answer.replace(/\s/g, '');
    let idx = -1;
    for (let i = 0; i < ans.length; i++) {
      const rr = w.dir === 'across' ? w.row : w.row + i;
      const cc = w.dir === 'across' ? w.col + i : w.col;
      if (rr === r && cc === c) {
        idx = i;
        break;
      }
    }
    if (idx < 0 || idx >= ans.length - 1) return;
    const nr = w.dir === 'across' ? r : r + 1;
    const nc = w.dir === 'across' ? c + 1 : c;
    if (nr >= 0 && nr < PUZZLE.size && nc >= 0 && nc < PUZZLE.size && grid[nr]?.[nc]) {
      setSelectedCell({ r: nr, c: nc });
      const key2 = `${nr},${nc}`;
      const words2 = cellWords[key2];
      if (words2) {
        const word2 = PUZZLE.words.find((w2) => w2.id === words2[0].id);
        if (word2) setCurrentWord({ word: word2, index: words2[0].index });
      }
    }
  };

  const moveToPrev = (r: number, c: number) => {
    const words = PUZZLE.words.filter((w) => {
      const ans = w.answer.replace(/\s/g, '');
      for (let i = 0; i < ans.length; i++) {
        const rr = w.dir === 'across' ? w.row : w.row + i;
        const cc = w.dir === 'across' ? w.col + i : w.col;
        if (rr === r && cc === c) return true;
      }
      return false;
    });
    if (!words.length) return;
    const w = words[0];
    const ans = w.answer.replace(/\s/g, '');
    let idx = -1;
    for (let i = 0; i < ans.length; i++) {
      const rr = w.dir === 'across' ? w.row : w.row + i;
      const cc = w.dir === 'across' ? w.col + i : w.col;
      if (rr === r && cc === c) {
        idx = i;
        break;
      }
    }
    if (idx <= 0) return;
    const nr = w.dir === 'across' ? r : r - 1;
    const nc = w.dir === 'across' ? c - 1 : c;
    if (nr >= 0 && nr < PUZZLE.size && nc >= 0 && nc < PUZZLE.size && grid[nr]?.[nc]) {
      setSelectedCell({ r: nr, c: nc });
      const key2 = `${nr},${nc}`;
      const words2 = cellWords[key2];
      if (words2) {
        const word2 = PUZZLE.words.find((w2) => w2.id === words2[0].id);
        if (word2) setCurrentWord({ word: word2, index: words2[0].index });
      }
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = 0;
    const result: Record<string, 'correct' | 'wrong'> = {};
    PUZZLE.words.forEach((w) => {
      const ans = w.answer.replace(/\s/g, '');
      for (let i = 0; i < ans.length; i++) {
        const r = w.dir === 'across' ? w.row : w.row + i;
        const c = w.dir === 'across' ? w.col : w.col + i;
        const key = `${r},${c}`;
        total++;
        const user = (userInput[key] ?? '').toLowerCase();
        const expected = ans[i].toLowerCase();
        result[key] = user === expected ? 'correct' : 'wrong';
        if (user === expected) correct++;
      }
    });
    setCheckResult(result);
    setStatus(total > 0 ? `正确 ${correct}/${total}` : '请先填写');
  };

  const reset = () => {
    setUserInput({});
    setSelectedCell(null);
    setCurrentWord(null);
    setStatus('');
    setCheckResult(null);
  };

  const across = PUZZLE.words.filter((w) => w.dir === 'across');
  const down = PUZZLE.words.filter((w) => w.dir === 'down');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: "'Segoe UI', 'Hiragino Sans', sans-serif",
        color: '#e8e8e8',
        padding: 24,
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div style={{ marginBottom: 16 }}>
        <Link to="/" style={{ color: '#aaccff', textDecoration: 'none' }}>← 返回</Link>
      </div>

      <h1 style={{ textAlign: 'center', color: '#e94560', fontSize: 28, marginBottom: 24 }}>日语填字游戏</h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${PUZZLE.size}, 36px)`,
            gridTemplateRows: `repeat(${PUZZLE.size}, 36px)`,
            gap: 2,
            background: '#2d2d44',
            padding: 8,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {grid.flatMap((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <div
                  key={`${r}-${c}`}
                  onClick={() => selectCell(r, c)}
                  style={{
                    width: 36,
                    height: 36,
                    background: selectedCell?.r === r && selectedCell?.c === c ? '#e94560' : highlighted.has(`${r},${c}`) ? 'rgba(233,69,96,0.25)' : '#1a1a2e',
                    border: `1px solid ${selectedCell?.r === r && selectedCell?.c === c ? '#e94560' : '#3d3d5c'}`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: checkResult?.[`${r},${c}`] === 'correct' ? '#4ecca3' : checkResult?.[`${r},${c}`] === 'wrong' ? '#e94560' : undefined,
                  }}
                >
                  {ROMA_TO_HIRA[userInput[`${r},${c}`] ?? ''] ?? userInput[`${r},${c}`] ?? ''}
                </div>
              ) : (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: 36,
                    height: 36,
                    background: '#2d2d44',
                    borderRadius: 6,
                  }}
                />
              )
            )
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 700, margin: '0 auto' }}>
        <div>
          <h3 style={{ color: '#e94560', fontSize: 16, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>横向（Across）</h3>
          {across.map((w) => (
            <div
              key={w.id}
              onClick={() => selectCell(w.row, w.col)}
              style={{
                padding: '8px 12px',
                marginBottom: 8,
                background: currentWord?.word.id === w.id ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ color: '#e94560', fontWeight: 600, marginRight: 8 }}>{w.id}.</span>
              {w.clue}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{w.answer}</div>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ color: '#e94560', fontSize: 16, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>纵向（Down）</h3>
          {down.map((w) => (
            <div
              key={w.id}
              onClick={() => selectCell(w.row, w.col)}
              style={{
                padding: '8px 12px',
                marginBottom: 8,
                background: currentWord?.word.id === w.id ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ color: '#e94560', fontWeight: 600, marginRight: 8 }}>{w.id}.</span>
              {w.clue}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{w.answer}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={checkAnswers}
          style={{
            padding: '10px 24px',
            margin: '0 8px',
            background: '#4ecca3',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: 24,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          检查答案
        </button>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            margin: '0 8px',
            background: 'rgba(255,255,255,0.15)',
            color: '#e8e8e8',
            border: 'none',
            borderRadius: 24,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          重新开始
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#4ecca3' }}>{status}</div>
    </div>
  );
}
