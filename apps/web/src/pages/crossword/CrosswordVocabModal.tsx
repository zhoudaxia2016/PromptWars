import { parseVocabLines } from './storage';

interface CrosswordVocabModalProps {
  open: boolean;
  onClose: () => void;
  vocabInput: string;
  onVocabInputChange: (value: string) => void;
  onSave: () => void;
}

export function CrosswordVocabModal({
  open,
  onClose,
  vocabInput,
  onVocabInputChange,
  onSave,
}: CrosswordVocabModalProps) {
  if (!open) return null;

  const vocabPairs = parseVocabLines(vocabInput);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          padding: 28,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          maxWidth: 520,
          width: '92%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              color: '#e94560',
              fontSize: 18,
              margin: 0,
              fontWeight: 600,
            }}
          >
            词汇本
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              width: 32,
              height: 32,
              borderRadius: 8,
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <p
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 13,
            margin: '0 0 12px 0',
          }}
        >
          每行格式：<strong>单词 假名</strong>（按第一个空格分隔）。至少 10
          条可生成填字。
        </p>
        <textarea
          value={vocabInput}
          onChange={(e) => onVocabInputChange(e.target.value)}
          placeholder={'例：\nkonnichiwa こんにちは\narigatou ありがとう\nohayou おはよう\n...'}
          style={{
            width: '100%',
            minHeight: 140,
            padding: '12px 14px',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10,
            color: '#e8e8e8',
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
          spellCheck={false}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            共{' '}
            <strong
              style={{
                color: vocabPairs.length >= 10 ? '#4ecca3' : '#e8e8e8',
              }}
            >
              {vocabPairs.length}
            </strong>{' '}
            条
          </span>
          <button
            type="button"
            onClick={onSave}
            style={{
              padding: '10px 20px',
              background: '#4ecca3',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            保存
          </button>
        </div>
        {vocabPairs.length > 0 && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              当前词汇
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                maxHeight: 120,
                overflowY: 'auto',
              }}
            >
              {vocabPairs.map(({ r, k }, i) => (
                <span
                  key={`${r}-${i}`}
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(233,69,96,0.15)',
                    color: '#e8e8e8',
                    borderRadius: 20,
                    fontSize: 13,
                  }}
                >
                  {r}
                  {k && (
                    <span style={{ opacity: 0.85, marginLeft: 6 }}>{k}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
