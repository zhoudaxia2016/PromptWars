import { ROMA_TO_HIRA, type GridCell } from '@promptwars/crossword';

interface CrosswordGridProps {
  grid: (GridCell | null)[][];
  puzzleSize: number;
  cellStartIds: Record<string, number[]>;
  userInput: Record<string, string>;
  selectedCell: { r: number; c: number } | null;
  highlighted: Set<string>;
  checkResult: Record<string, 'correct' | 'wrong'> | null;
  onSelectCell: (r: number, c: number) => void;
}

export function CrosswordGrid({
  grid,
  puzzleSize,
  cellStartIds,
  userInput,
  selectedCell,
  highlighted,
  checkResult,
  onSelectCell,
}: CrosswordGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${puzzleSize}, 36px)`,
        gridTemplateRows: `repeat(${puzzleSize}, 36px)`,
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
              onClick={() => onSelectCell(r, c)}
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                background:
                  selectedCell?.r === r && selectedCell?.c === c
                    ? '#e94560'
                    : highlighted.has(`${r},${c}`)
                      ? 'rgba(233,69,96,0.25)'
                      : '#1a1a2e',
                border: `1px solid ${
                  selectedCell?.r === r && selectedCell?.c === c ? '#e94560' : '#3d3d5c'
                }`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                color:
                  checkResult?.[`${r},${c}`] === 'correct'
                    ? '#4ecca3'
                    : checkResult?.[`${r},${c}`] === 'wrong'
                      ? '#e94560'
                      : undefined,
              }}
            >
              {cellStartIds[`${r},${c}`] != null && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1,
                  }}
                >
                  {cellStartIds[`${r},${c}`].join('-')}
                </span>
              )}
              {(() => {
                const val = userInput[`${r},${c}`] ?? '';
                const isKanaCell =
                  cell && /[\u3040-\u309F\u30A0-\u30FF]/.test(cell.char);
                return isKanaCell ? val : ROMA_TO_HIRA[val] ?? val;
              })()}
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
  );
}
