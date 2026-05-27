import './Badge.css';

const Badge = ({
  id,
  name,
  icon,
  isEarned,
  progress = 0,
  progressText,
  statusText,
  isSelected,
  onSelect,
}) => {
  const progressValue = Math.round(Math.max(0, Math.min(100, Number(progress) || 0)));

  return (
    <button
      className={`badge-card ${isEarned ? 'badge-card--earned' : 'badge-card--locked'} ${isSelected ? 'badge-card--selected' : ''}`}
      type="button"
      aria-pressed={isSelected}
      aria-label={`${name}. ${isEarned ? 'Earned' : progressText}. Tap to view details.`}
      onClick={() => onSelect?.(id)}
    >
      <span className="badge-medal" aria-hidden="true">
        <span className="badge-icon">{icon}</span>
      </span>
      <span className="badge-name">{name}</span>
      <span className="badge-status">{statusText}</span>
      {!isEarned && (
        <span className="badge-progress-track" aria-hidden="true">
          <span className="badge-progress-fill" style={{ width: `${progressValue}%` }} />
        </span>
      )}
    </button>
  );
};

export default Badge;
