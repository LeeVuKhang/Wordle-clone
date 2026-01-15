import Cell from './Cell';
import './Row.css';

const Row = ({ guess, currentGuess, isCurrentRow }) => {
    // Create array of 5 cells
    const cells = [];

    // If this row has a completed guess, use the guess data
    if (guess) {
        for (let i = 0; i < 5; i++) {
            cells.push(
                <Cell
                    key={i}
                    value={guess[i]?.letter}
                    status={guess[i]?.status}
                />
            );
        }
    }
    // If this is the current row being typed, show current input
    else if (isCurrentRow && currentGuess) {
        for (let i = 0; i < 5; i++) {
            cells.push(
                <Cell
                    key={i}
                    value={currentGuess[i] || ''}
                    status={currentGuess[i] ? 'filled' : ''}
                />
            );
        }
    }
    // Otherwise show empty cells
    else {
        for (let i = 0; i < 5; i++) {
            cells.push(<Cell key={i} value="" status="" />);
        }
    }

    return (
        <div className="row">
            {cells}
        </div>
    );
};

export default Row;
