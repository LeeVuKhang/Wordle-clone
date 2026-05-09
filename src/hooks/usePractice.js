/**
 * usePractice — Practice mode state machine (server-side comparison)
 *
 * WBS Tasks 8.7, 6B
 * No streak impact. Sessions auto-expire after 30 min.
 */

import { useState, useCallback } from 'react';
import { practiceApi } from '../services/api.js';
import { isValidGuess } from '../utils/compareWord.js';

export function usePractice() {
  const [practiceId, setPracticeId] = useState(null);
  const [guessResults, setGuessResults] = useState([]);
  const [submittedWords, setSubmittedWords] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [keyboardStatus, setKeyboardStatus] = useState({});
  const [gameStatus, setGameStatus] = useState('PLAYING');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await practiceApi.newSession();
      setPracticeId(res.data.practiceId);
      setGuessResults([]);
      setSubmittedWords([]);
      setCurrentGuess('');
      setKeyboardStatus({});
      setGameStatus('PLAYING');
      setAttempts(0);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to start practice session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLetter = useCallback((letter) => {
    if (gameStatus !== 'PLAYING' || currentGuess.length >= 5) return;
    setCurrentGuess((prev) => prev + letter.toUpperCase());
  }, [gameStatus, currentGuess]);

  const handleDelete = useCallback(() => {
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, []);

  const handleEnter = useCallback(async () => {
    if (gameStatus !== 'PLAYING' || !practiceId) return;
    if (currentGuess.length < 5) { showToast('Not enough letters', 'warning'); return; }
    if (!isValidGuess(currentGuess)) { showToast('Not in word list', 'warning'); return; }

    setIsLoading(true);
    try {
      const res = await practiceApi.guess({ practiceId, guess: currentGuess });
      const { result, status } = res.data;

      // Build keyboard status update
      const STATUS_PRIORITY = { correct: 3, present: 2, absent: 1 };
      const newKeyboard = { ...keyboardStatus };
      for (const { letter, status: s } of result) {
        const current = newKeyboard[letter];
        if (!current || STATUS_PRIORITY[s] > STATUS_PRIORITY[current]) {
          newKeyboard[letter] = s;
        }
      }

      const newWords = [...submittedWords, currentGuess];
      setGuessResults((prev) => [...prev, result]);
      setSubmittedWords(newWords);
      setKeyboardStatus(newKeyboard);
      setAttempts(newWords.length);
      setCurrentGuess('');
      setGameStatus(status);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error submitting guess';
      if (err.response?.status === 410) {
        showToast('Practice session expired — starting new session', 'warning');
        await startSession();
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [gameStatus, practiceId, currentGuess, submittedWords, keyboardStatus, showToast, startSession]);

  const handleKeyPress = useCallback((key) => {
    if (key === 'ENTER') handleEnter();
    else if (key === 'DELETE' || key === 'BACKSPACE') handleDelete();
    else if (/^[A-Z]$/.test(key)) handleLetter(key);
  }, [handleEnter, handleDelete, handleLetter]);

  return {
    practiceId, guessResults, submittedWords,
    currentGuess, keyboardStatus, gameStatus, attempts,
    isLoading, error, toast,
    startSession, handleKeyPress,
  };
}
