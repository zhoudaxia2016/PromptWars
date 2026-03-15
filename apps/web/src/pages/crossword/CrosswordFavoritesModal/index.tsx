import type { Puzzle } from '../core';
import s from './index.module.less';

interface CrosswordFavoritesModalProps {
  open: boolean;
  onClose: () => void;
  favoritesList: Puzzle[];
  onLoad: (item: Puzzle) => void;
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
    <div className={s.favoritesModalOverlay} onClick={onClose}>
      <div className={s.favoritesModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={s.favoritesModalHeader}>
          <h3 className={s.favoritesModalTitle}>收藏的题目</h3>
          <button
            type="button"
            onClick={onClose}
            className={s.favoritesModalClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        {favoritesList.length === 0 ? (
          <div className={s.emptyState}>
            暂无收藏，完成一局后点击「收藏」保存题目
          </div>
        ) : (
          <div className={s.favoritesList}>
            {favoritesList.map((item, i) => (
              <div
                key={item.id ?? `fav-${i}`}
                role="button"
                tabIndex={0}
                className={s.favoriteItem}
                onClick={() => onLoad(item)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  !(e.target as HTMLElement).closest('button') &&
                  onLoad(item)
                }
              >
                <div className={s.favoriteInfo}>
                  <div className={s.favoriteDate}>
                    {new Date(item.savedAt ?? 0).toLocaleString('zh-CN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                  <div className={s.favoriteDesc}>
                    {item.words.length} 道题 · 首条：
                    {item.words[0]?.clue?.slice(0, 20)}
                    {item.words[0]?.clue &&
                    item.words[0].clue.length > 20
                      ? '…'
                      : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.id) onRemove(item.id);
                  }}
                  className={s.btnRemove}
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
