import { useState } from 'react';
import Header from './components/Header';
import GameBoard from './components/GameBoard';
import Keyboard from './components/Keyboard';
import Modal from './components/Modal';
import './App.css';

function App() {
    // Temporary demo state to test UI
    const [guesses, setGuesses] = useState([
        // Example of a completed guess with results
        [
            { letter: 'H', status: 'absent' },
            { letter: 'E', status: 'present' },
            { letter: 'L', status: 'absent' },
            { letter: 'L', status: 'absent' },
            { letter: 'O', status: 'correct' }
        ]
    ]);
    const [currentGuess, setCurrentGuess] = useState('WOR');
    const [currentRow, setCurrentRow] = useState(1);
    const [keyboardStatus, setKeyboardStatus] = useState({
        'H': 'absent',
        'E': 'present',
        'L': 'absent',
        'O': 'correct'
    });
    const [showModal, setShowModal] = useState(false);

    const handleKeyPress = (key) => {
        console.log('Key pressed:', key);
        // Logic will be implemented in Phase 3
    };

    const handleNewGame = () => {
        console.log('New game clicked');
        // Logic will be implemented later
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
                disabled={false}
            />
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Congratulations!"
                message="You won the game!"
                onAction={handleNewGame}
                actionText="Play Again"
            />
        </div>
    );
}

export default App
