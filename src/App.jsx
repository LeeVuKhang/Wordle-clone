import { useState, useEffect, useCallback } from 'react';

import Header    from './components/Header';
import GameBoard from './components/GameBoard';
import Keyboard  from './components/Keyboard';
import Modal     from './components/Modal';
import Toast     from './components/Toast';
import AuthModal from './components/AuthModal';

import { useAuth }     from './hooks/useAuth';
import { useGame }     from './hooks/useGame';
import { usePractice } from './hooks/usePractice';
import { initSyncRetryService } from './services/syncRetry.js';

import './App.css';

// Initialise retry queue listener once at module level
initSyncRetryService();

// ─── OAuth callback handler ───────────────────────────────────────────────────
/**
 * If the current URL contains ?code=..., we are on the OAuth redirect-back page.
 * Extract the code and return it (cleared from the URL), otherwise return null.
 */
function consumeOAuthCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    // Clean up URL without a page reload
    window.history.replaceState({}, document.title, window.location.pathname);
    return code;
  }
  return null;
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [mode, setMode]               = useState('daily');   // 'daily' | 'practice'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mergeResult, setMergeResult] = useState(null);
  const [modalDismissed, setModalDismissed] = useState(false);

  const auth     = useAuth();
  const daily    = useGame();
  const practice = usePractice();

  // Active game depends on mode
  const game = mode === 'daily' ? daily : practice;

  // ── Handle OAuth redirect-back ─────────────────────────────────────────
  useEffect(() => {
    const code = consumeOAuthCode();
    if (!code) return;
    const redirectUri =
      import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    auth.login(code, redirectUri).then((data) => {
      if (data?.mergeResult) {
        setMergeResult(data.mergeResult);
        setShowAuthModal(true);   // show merge success modal
      }
    }).catch(() => {
      // auth.error is set inside the hook
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start practice session when switching to practice mode ────────────
  useEffect(() => {
    if (mode === 'practice' && !practice.practiceId) {
      practice.startSession();
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Physical keyboard ─────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toUpperCase();
      if (key === 'ENTER')     game.handleKeyPress('ENTER');
      else if (key === 'BACKSPACE') { e.preventDefault(); game.handleKeyPress('BACKSPACE'); }
      else if (/^[A-Z]$/.test(key)) game.handleKeyPress(key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game.handleKeyPress]);

  // ── Modal derived state ───────────────────────────────────────────────
  const isGameOver = game.gameStatus === 'WON' || game.gameStatus === 'LOST';
  const isWon      = game.gameStatus === 'WON';

  useEffect(() => {
    if (game.gameStatus === 'PLAYING') setModalDismissed(false);
  }, [game.gameStatus]);

  const modalTitle   = isWon ? 'You won!' : 'Game over';
  const modalMessage = isWon
    ? `You got it in ${game.attempts} ${game.attempts === 1 ? 'try' : 'tries'}!`
    : `The word was ${mode === 'daily' ? daily.targetWord : practice.targetWord}`;
  const gameStatusText = game.gameStatus === 'PLAYING'
    ? `${game.attempts}/6 attempts`
    : game.gameStatus.toLowerCase();

  const handleModeSwitch = useCallback((newMode) => {
    setMode(newMode);
    setModalDismissed(false);
  }, []);

  // ── Loading state ─────────────────────────────────────────────────────
  if (auth.isLoading || (mode === 'daily' && daily.isLoading)) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (mode === 'daily' && daily.error) {
    return (
      <div className="App">
        <Header
          mode={mode}
          onSwitchMode={handleModeSwitch}
          user={auth.user}
          onAuthClick={() => setShowAuthModal(true)}
          onLogout={auth.logout}
        />
        <div className="app-error">
          <p>{daily.error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Header
        mode={mode}
        onSwitchMode={handleModeSwitch}
        user={auth.user}
        onAuthClick={() => setShowAuthModal(true)}
        onLogout={auth.logout}
      />

      {/* Toast notifications (Task 8.10) */}
      <Toast message={game.toast?.message} type={game.toast?.type} />

      {/* Practice loading spinner */}
      {mode === 'practice' && practice.isLoading && !practice.practiceId && (
        <div className="app-loading">
          <div className="spinner" />
        </div>
      )}

      <main className="game-shell" aria-label="Wordle game">
        <section className="game-status-strip" aria-label="Current game status">
          <span>{mode === 'daily' ? 'Daily Challenge' : 'Practice Mode'}</span>
          <span>{gameStatusText}</span>
        </section>

        {/* Game board */}
        <GameBoard
          guessResults={game.guessResults}
          currentGuess={game.currentGuess}
          currentRow={game.submittedWords.length}
        />

        {/* Virtual keyboard */}
        <Keyboard
          onKeyPress={game.handleKeyPress}
          keyboardStatus={game.keyboardStatus}
          disabled={isGameOver || (mode === 'practice' && practice.isLoading)}
        />
      </main>

      {/* Game-over modal */}
      <Modal
        isOpen={isGameOver && !modalDismissed}
        onClose={() => setModalDismissed(true)}
        title={modalTitle}
        message={modalMessage}
        onAction={mode === 'practice' ? practice.startSession : undefined}
        actionText={mode === 'practice' ? 'Play Again' : undefined}
      />

      {/* Auth modal (Task 8.2, 8.11) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setMergeResult(null); }}
        isLoading={auth.isLoading}
        error={auth.error}
        mergeResult={mergeResult}
      />
    </div>
  );
}

export default App;
