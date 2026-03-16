import { useState, useEffect } from 'react';
import { parseVocabLines, VOCAB_STORAGE_KEY } from '../storage';
import s from './index.module.less';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function VocabModal({ open, onClose }: Props) {
  const [vocabInput, setVocabInput] = useState(() => {
    try {
      return localStorage.getItem(VOCAB_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (open) {
      try {
        setVocabInput(localStorage.getItem(VOCAB_STORAGE_KEY) ?? '');
      } catch {
        // ignore
      }
    }
  }, [open]);

  const handleSave = () => {
    const pairs = parseVocabLines(vocabInput);
    const value = pairs.map(({ r, k }) => (k ? `${r} ${k}` : r)).join('\n');
    try {
      localStorage.setItem(VOCAB_STORAGE_KEY, value);
      setVocabInput(value);
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  const vocabPairs = parseVocabLines(vocabInput);

  return (
    <div className={s.vocabModalOverlay} onClick={onClose}>
      <div className={s.vocabModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={s.vocabModalHeader}>
          <h3 className={s.vocabModalTitle}>词汇本</h3>
          <button
            type="button"
            onClick={onClose}
            className={s.vocabModalClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <p className={s.vocabModalHint}>
          每行格式：<strong>单词 假名</strong>（按第一个空格分隔）。至少 10
          条可生成填字。
        </p>
        <textarea
          value={vocabInput}
          onChange={(e) => setVocabInput(e.target.value)}
          placeholder={'例：\nkonnichiwa こんにちは\narigatou ありがとう\nohayou おはよう\n...'}
          className={s.vocabTextarea}
          spellCheck={false}
        />
        <div className={s.vocabFooter}>
          <span className={`${s.vocabCount} ${vocabPairs.length >= 10 ? s.enough : ''}`}>
            共 <strong>{vocabPairs.length}</strong> 条
          </span>
          <button type="button" onClick={handleSave} className={s.btnSave}>
            保存
          </button>
        </div>
        {vocabPairs.length > 0 && (
          <div className={s.vocabPreview}>
            <div className={s.vocabPreviewTitle}>当前词汇</div>
            <div className={s.vocabTags}>
              {vocabPairs.map(({ r, k }, i) => (
                <span key={`${r}-${i}`} className={s.vocabTag}>
                  {r}
                  {k && <span className={s.kana}>{k}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
