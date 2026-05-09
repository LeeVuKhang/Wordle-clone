import './Key.css';

/**
 * Key — single keyboard button
 * status: 'correct' | 'present' | 'absent' | undefined
 */
const Key = ({ value, status, onClick, isWide = false }) => {
  return (
    <button
      className={`key ${isWide ? 'wide' : ''} ${status || ''}`}
      onClick={() => onClick(value)}
      aria-label={value}
    >
      {value}
    </button>
  );
};

export default Key;
