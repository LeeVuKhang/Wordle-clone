import './Cell.css';

/**
 * Cell — single letter tile
 * status values: 'correct' | 'present' | 'absent' | 'filled' | ''
 */
const Cell = ({ value, status, revealDelay = 0 }) => {
  const style = (status === 'correct' || status === 'present' || status === 'absent')
    ? { animationDelay: `${revealDelay}s` }
    : {};

  return (
    <div className={`cell ${status || ''}`} style={style}>
      {value}
    </div>
  );
};

export default Cell;
