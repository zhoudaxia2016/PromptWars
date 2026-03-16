import type { Puzzle } from '../core';
import s from './index.module.less';

interface Props {
  words: Puzzle['words'];
  title: string;
  currentWord: { word: Puzzle['words'][0]; index: number } | null;
  checkResult: Record<string, 'correct' | 'wrong'> | null;
  formatAnswer: (w: Puzzle['words'][0]) => string;
  onSelectCell: (r: number, c: number) => void;
}

export function ClueList({
  words,
  title,
  currentWord,
  checkResult,
  formatAnswer,
  onSelectCell,
}: Props) {
  return (
    <div className={s.clueList}>
      <h3 className={s.clueTitle}>{title}</h3>
      <div className={s.clueScroll}>
        {words.map((w) => (
          <div
            key={w.id}
            onClick={() => onSelectCell(w.row, w.col)}
            className={`${s.clueItem} ${currentWord?.word.id === w.id ? s.current : ''}`}
          >
            <span className={s.clueId}>{w.id}.</span>
            {w.clue}
            {checkResult != null && (
              <div className={s.clueAnswer}>答：{formatAnswer(w)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
