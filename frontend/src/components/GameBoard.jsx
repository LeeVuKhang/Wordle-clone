import Row from './Row';
import './GameBoard.css';

/**
 * GameBoard — 6×5 grid of guess rows
 *
 * @param {{ guessResults: object[][], currentGuess: string, currentRow: number }} props
 */
const GameBoard = ({ guessResults, currentGuess, currentRow }) => {
  return (
    <div className="game-board">
      {[...Array(6)].map((_, i) => (
        <Row
          key={i}
          result={guessResults[i] || null}
          currentGuess={i === currentRow ? currentGuess : null}
          isCurrentRow={i === currentRow}
        />
      ))}
    </div>
  );
};

export default GameBoard;
