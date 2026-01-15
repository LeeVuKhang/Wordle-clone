import Row from './Row';
import './GameBoard.css';

const GameBoard = ({ guesses, currentGuess, currentRow }) => {
    return (
        <div className="game-board">
            {[...Array(6)].map((_, i) => (
                <Row
                    key={i}
                    guess={guesses[i]}
                    currentGuess={i === currentRow ? currentGuess : null}
                    isCurrentRow={i === currentRow}
                />
            ))}
        </div>
    );
};

export default GameBoard;
