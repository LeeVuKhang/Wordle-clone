import { useState, useEffect } from 'react';
import Header from './components/Header';
import GameBoard from './components/GameBoard';
import Keyboard from './components/Keyboard';
import Modal from './components/Modal';
import './App.css';

function App() {
    // Game state
    const [guesses, setGuesses] = useState([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [currentRow, setCurrentRow] = useState(0);
    const [keyboardStatus, setKeyboardStatus] = useState({});
    const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });

    // Handle keyboard input from virtual keyboard
    const handleKeyPress = (key) => {
        if (gameStatus !== 'playing') return;

        if (key === 'ENTER') {
            handleEnter();
        } else if (key === 'DELETE') {
            handleDelete();
        } else {
            handleLetterInput(key);
        }
    };

    // Handle letter input (A-Z)
    const handleLetterInput = (letter) => {
        if (currentGuess.length < 5) {
            setCurrentGuess(prev => prev + letter);
        }
    };

    // Handle delete/backspace
    const handleDelete = () => {
        setCurrentGuess(prev => prev.slice(0, -1));
    };

    // Handle enter/submit (placeholder for now)
    const handleEnter = () => {
        if (currentGuess.length === 5) {
            console.log('Submitting guess:', currentGuess);
            // TODO: Will connect to backend API in Phase 5
            // For now, just show a message
            alert(`You entered: ${currentGuess}\n\nBackend integration coming in Phase 4-5!`);
        } else {
            console.log('Not enough letters');
        }
    };

    // Handle physical keyboard events
    useEffect(() => {
        const handlePhysicalKeyboard = (e) => {
            if (gameStatus !== 'playing') return;

            const key = e.key.toUpperCase();

            if (key === 'ENTER') {
                handleEnter();
            } else if (key === 'BACKSPACE') {
                e.preventDefault();
                handleDelete();
            } else if (/^[A-Z]$/.test(key)) {
                handleLetterInput(key);
            }
        };

        window.addEventListener('keydown', handlePhysicalKeyboard);

        return () => {
            window.removeEventListener('keydown', handlePhysicalKeyboard);
        };
    }, [currentGuess, gameStatus]); // Re-attach listener when dependencies change

    // Handle new game
    const handleNewGame = () => {
        setGuesses([]);
        setCurrentGuess('');
        setCurrentRow(0);
        setKeyboardStatus({});
        setGameStatus('playing');
        setShowModal(false);
        console.log('New game started');
    };

    return (
        <div className="App">
            <Header onNewGame={handleNewGame} />
            <GameBoard
                guesses={guesses}
                currentGuess={currentGuess}
                currentRow={currentRow}
            />
            <Keyboard
                onKeyPress={handleKeyPress}
                keyboardStatus={keyboardStatus}
                disabled={gameStatus !== 'playing'}
            />
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalContent.title}
                message={modalContent.message}
                onAction={handleNewGame}
                actionText="Play Again"
            />
        </div>
    );
}

export default App
