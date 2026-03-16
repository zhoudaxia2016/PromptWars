import { useMemo } from 'react';
import { ROMA_TO_HIRA, type GridCell, type PuzzleWord } from '../core';
import s from './index.module.less';

function getHighlightedCells(currentWord: { word: PuzzleWord; index: number } | null): Set<string> {
  if (!currentWord) return new Set<string>();
  const set = new Set<string>();
  const ans = currentWord.word.answer.replace(/\s/g, '');
  for (let i = 0; i < ans.length; i++) {
    const r =
      currentWord.word.dir === 'across'
        ? currentWord.word.row
        : currentWord.word.row + i;
    const c =
      currentWord.word.dir === 'across'
        ? currentWord.word.col + i
        : currentWord.word.col;
    set.add(`${r},${c}`);
  }
  return set;
}

interface Props {
  grid: (GridCell | null)[][];
  puzzleSize: number;
  cellStartIds: Record<string, number[]>;
  userInput: Record<string, string>;
  selectedCell: { r: number; c: number } | null;
  currentWord: { word: PuzzleWord; index: number } | null;
  checkResult: Record<string, 'correct' | 'wrong'> | null;
  onSelectCell: (r: number, c: number) => void;
}

export function Grid({
  grid,
  puzzleSize,
  cellStartIds,
  userInput,
  selectedCell,
  currentWord,
  checkResult,
  onSelectCell,
}: Props) {
  const highlighted = useMemo(() => getHighlightedCells(currentWord), [currentWord]);
  return (
    <div
      className={s.grid}
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
