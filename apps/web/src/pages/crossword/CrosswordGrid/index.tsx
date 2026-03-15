import { ROMA_TO_HIRA, type GridCell } from '../core';
import s from './index.module.less';

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
      className={s.crosswordGrid}
      style={{
        gridTemplateColumns: `repeat(${puzzleSize}, 36px)`,
        gridTemplateRows: `repeat(${puzzleSize}, 36px)`,
      }}
    >
      {grid.flatMap((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <div
              key={`${r}-${c}`}
              onClick={() => onSelectCell(r, c)}
              className={`${s.cell} ${
                selectedCell?.r === r && selectedCell?.c === c
                  ? s.selected
                  : highlighted.has(`${r},${c}`)
                    ? s.highlighted
                    : ''
              } ${
                checkResult?.[`${r},${c}`] === 'correct'
                  ? s.correct
                  : checkResult?.[`${r},${c}`] === 'wrong'
                    ? s.wrong
                    : ''
              }`}
            >
              {cellStartIds[`${r},${c}`] != null && (
                <span className={s.cellNumber}>
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
            <div key={`${r}-${c}`} className={s.cellBlock} />
          )
        )
      )}
    </div>
  );
}
