import Key from './Key';
import './Keyboard.css';

const Keyboard = ({ onKeyPress, keyboardStatus, disabled }) => {
    // QWERTY layout
    const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
    const row3 = ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'];

    const handleKeyClick = (key) => {
        if (!disabled) {
            onKeyPress(key);
        }
    };

    return (
        <div className="keyboard">
            <div className="keyboard-row">
                {row1.map((key) => (
                    <Key
                        key={key}
                        value={key}
                        status={keyboardStatus[key]}
                        onClick={handleKeyClick}
                        disabled={disabled}
                    />
                ))}
            </div>
            <div className="keyboard-row">
                {row2.map((key) => (
                    <Key
                        key={key}
                        value={key}
                        status={keyboardStatus[key]}
                        onClick={handleKeyClick}
                        disabled={disabled}
                    />
                ))}
            </div>
            <div className="keyboard-row">
                {row3.map((key) => (
                    <Key
                        key={key}
                        value={key}
                        status={keyboardStatus[key]}
                        onClick={handleKeyClick}
                        isWide={key === 'ENTER' || key === 'DELETE'}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
};

export default Keyboard;
