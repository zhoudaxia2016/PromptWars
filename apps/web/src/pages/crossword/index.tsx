import { Link } from 'react-router-dom';
import { usePuzzle } from './usePuzzle';
import { Grid } from './Grid';
import { ClueList } from './ClueList';
import { VocabModal } from './VocabModal';
import { FavoritesModal } from './FavoritesModal';
import s from './index.module.less';

export default function Page() {
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
  } = usePuzzle();

  return (
    <div
      className={s.crossword}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={s.header}>
        <Link to="/" className={s.backLink}>
          ← 返回
        </Link>
        <div className={s.headerActions}>
          <button type="button" onClick={openFavoritesModal} className={s.btnSecondary}>
            收藏列表
          </button>
          <button
            type="button"
            onClick={() => setVocabModalOpen(true)}
            className={s.btnSecondary}
          >
            录入单词
          </button>
        </div>
      </div>

      <h1 className={s.title}>日语填字游戏</h1>

      <div className={s.main}>
        <div className={s.gridSection}>
          <Grid
            grid={grid}
            puzzleSize={puzzle.size}
            cellStartIds={cellStartIds}
            userInput={userInput}
            selectedCell={selectedCell}
            highlighted={highlighted}
            checkResult={checkResult}
            onSelectCell={selectCell}
          />
          <div className={s.actions}>
            <button onClick={checkAnswers} className={s.btnCheck}>
              检查答案
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={s.btnGenerate}
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
              className={`${s.btnFavorite} ${isCurrentFavorited ? s.isFavorited : ''}`}
            >
              {isCurrentFavorited ? '取消收藏' : '收藏'}
            </button>
          </div>
        </div>
        <div className={s.clueSection}>
          <ClueList
            words={across}
            title="横向（Across）"
            currentWord={currentWord}
            checkResult={checkResult}
            formatAnswer={formatAnswer}
            onSelectCell={selectCell}
          />
          <ClueList
            words={down}
            title="纵向（Down）"
            currentWord={currentWord}
            checkResult={checkResult}
            formatAnswer={formatAnswer}
            onSelectCell={selectCell}
          />
        </div>
      </div>

      <div className={s.statusBar}>
        {status && <span className={s.statusSuccess}>{status}</span>}
        {generating && <span className={s.statusLoading}>正在生成填字…</span>}
        {generateError && !vocabModalOpen && (
          <span className={s.statusError}>{generateError}</span>
        )}
      </div>

      <VocabModal
        open={vocabModalOpen}
        onClose={() => setVocabModalOpen(false)}
        vocabInput={vocabInput}
        onVocabInputChange={setVocabInput}
        onSave={saveVocab}
      />

      <FavoritesModal
        open={favoritesModalOpen}
        onClose={() => setFavoritesModalOpen(false)}
        favoritesList={favoritesList}
        onLoad={loadFavorite}
        onRemove={removeFromFavorites}
      />
    </div>
  );
}
