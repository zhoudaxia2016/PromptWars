import { Link } from 'react-router-dom';
import { useCrossword } from './useCrossword';
import { CrosswordGrid } from './CrosswordGrid';
import { CrosswordClueList } from './CrosswordClueList';
import { CrosswordVocabModal } from './CrosswordVocabModal';
import { CrosswordFavoritesModal } from './CrosswordFavoritesModal';

export default function CrosswordPage() {
  const {
    puzzle,
    grid,
    cellStartIds,
    userInput,
    selectedCell,
    highlighted,
    checkResult,
    status,
    generating,
    generateError,
    vocabModalOpen,
    setVocabModalOpen,
    favoritesModalOpen,
    setFavoritesModalOpen,
    vocabInput,
    setVocabInput,
    favoritesList,
    currentFavoriteId,
    currentWord,
    across,
    down,
    selectCell,
    formatAnswer,
    handleKeyDown,
    checkAnswers,
    saveVocab,
    addToFavorites,
    removeFromFavorites,
    openFavoritesModal,
    loadFavorite,
    handleGenerate,
    isCurrentFavorited,
  } = useCrossword();

  const btnStyle = {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.1)',
    color: '#e8e8e8',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer' as const,
  };

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: "'Segoe UI', 'Hiragino Sans', sans-serif",
        color: '#e8e8e8',
        padding: 24,
        boxSizing: 'border-box',
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Link to="/" style={{ color: '#aaccff', textDecoration: 'none' }}>
          ← 返回
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={openFavoritesModal} style={btnStyle}>
            收藏列表
          </button>
          <button
            type="button"
            onClick={() => setVocabModalOpen(true)}
            style={btnStyle}
          >
            录入单词
          </button>
        </div>
      </div>

      <h1
        style={{
          textAlign: 'center',
          color: '#e94560',
          fontSize: 28,
          marginBottom: 24,
          flexShrink: 0,
        }}
      >
        日语填字游戏
      </h1>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 32,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <CrosswordGrid
            grid={grid}
            puzzleSize={puzzle.size}
            cellStartIds={cellStartIds}
            userInput={userInput}
            selectedCell={selectedCell}
            highlighted={highlighted}
            checkResult={checkResult}
            onSelectCell={selectCell}
          />
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={checkAnswers}
              style={{
                padding: '10px 24px',
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
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '10px 24px',
                background: generating ? 'rgba(233,69,96,0.5)' : '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                fontSize: 14,
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? '正在生成…' : '重新生成'}
            </button>
            <button
              type="button"
              onClick={
                isCurrentFavorited
                  ? () => removeFromFavorites(currentFavoriteId!)
                  : addToFavorites
              }
              style={{
                padding: '10px 24px',
                background: isCurrentFavorited
                  ? 'rgba(233,69,96,0.25)'
                  : 'rgba(255,255,255,0.12)',
                color: '#e8e8e8',
                border: `1px solid ${
                  isCurrentFavorited ? 'rgba(233,69,96,0.5)' : 'rgba(255,255,255,0.25)'
                }`,
                borderRadius: 24,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {isCurrentFavorited ? '取消收藏' : '收藏'}
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            minWidth: 320,
            maxWidth: 420,
            flex: 1,
            minHeight: 0,
            alignSelf: 'stretch',
          }}
        >
          <CrosswordClueList
            words={across}
            title="横向（Across）"
            currentWord={currentWord}
            checkResult={checkResult}
            formatAnswer={formatAnswer}
            onSelectCell={selectCell}
          />
          <CrosswordClueList
            words={down}
            title="纵向（Down）"
            currentWord={currentWord}
            checkResult={checkResult}
            formatAnswer={formatAnswer}
            onSelectCell={selectCell}
          />
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          textAlign: 'center',
          marginTop: 8,
          fontSize: 14,
        }}
      >
        {status && <span style={{ color: '#4ecca3' }}>{status}</span>}
        {generating && (
          <span style={{ color: '#aaccff' }}>正在生成填字…</span>
        )}
        {generateError && !vocabModalOpen && (
          <span
            style={{
              color: '#e94560',
              display: 'block',
              marginTop: 4,
            }}
          >
            {generateError}
          </span>
        )}
      </div>

      <CrosswordVocabModal
        open={vocabModalOpen}
        onClose={() => setVocabModalOpen(false)}
        vocabInput={vocabInput}
        onVocabInputChange={setVocabInput}
        onSave={saveVocab}
      />

      <CrosswordFavoritesModal
        open={favoritesModalOpen}
        onClose={() => setFavoritesModalOpen(false)}
        favoritesList={favoritesList}
        onLoad={loadFavorite}
        onRemove={removeFromFavorites}
      />
    </div>
  );
}
