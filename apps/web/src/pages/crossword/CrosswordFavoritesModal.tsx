import type { SavedPuzzle } from './storage';

interface CrosswordFavoritesModalProps {
  open: boolean;
  onClose: () => void;
  favoritesList: SavedPuzzle[];
  onLoad: (item: SavedPuzzle) => void;
  onRemove: (id: string) => void;
}

export function CrosswordFavoritesModal({
  open,
  onClose,
  favoritesList,
  onLoad,
  onRemove,
}: CrosswordFavoritesModalProps) {
  if (!open) return null;

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
          maxWidth: 480,
          width: '92%',
          maxHeight: '80vh',
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
            marginBottom: 16,
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
            收藏的题目
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
        {favoritesList.length === 0 ? (
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              padding: 24,
              textAlign: 'center',
            }}
          >
            暂无收藏，完成一局后点击「收藏」保存题目
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {favoritesList.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onLoad(item)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  !(e.target as HTMLElement).closest('button') &&
                  onLoad(item)
                }
                style={{
                  padding: '12px 16px',
                  marginBottom: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: '#e8e8e8',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {new Date(item.savedAt).toLocaleString('zh-CN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    {item.puzzle.words.length} 道题 · 首条：
                    {item.puzzle.words[0]?.clue?.slice(0, 20)}
                    {item.puzzle.words[0]?.clue &&
                    item.puzzle.words[0].clue.length > 20
                      ? '…'
                      : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(233,69,96,0.2)',
                    color: '#e8e8e8',
                    border: '1px solid rgba(233,69,96,0.4)',
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  取消收藏
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
