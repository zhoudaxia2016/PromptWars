import type { Puzzle } from './core';

interface CrosswordClueListProps {
  words: Puzzle['words'];
  title: string;
  currentWord: { word: Puzzle['words'][0]; index: number } | null;
  checkResult: Record<string, 'correct' | 'wrong'> | null;
  formatAnswer: (w: Puzzle['words'][0]) => string;
  onSelectCell: (r: number, c: number) => void;
}

export function CrosswordClueList({
  words,
  title,
  currentWord,
  checkResult,
  formatAnswer,
  onSelectCell,
}: CrosswordClueListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <h3
        style={{
          color: '#e94560',
          fontSize: 16,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}
      >
        {title}
      </h3>
      <div style={{ flex: 1, minHeight: 0 }} className="crossword-clue-list">
        {words.map((w) => (
          <div
            key={w.id}
            onClick={() => onSelectCell(w.row, w.col)}
            style={{
              padding: '8px 12px',
              marginBottom: 8,
              background:
                currentWord?.word.id === w.id
                  ? 'rgba(233,69,96,0.2)'
                  : 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <span
              style={{ color: '#e94560', fontWeight: 600, marginRight: 8 }}
            >
              {w.id}.
            </span>
            {w.clue}
            {checkResult != null && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: 4,
                }}
              >
                答：{formatAnswer(w)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
