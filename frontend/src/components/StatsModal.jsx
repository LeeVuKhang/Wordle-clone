import { useEffect } from 'react';
import './PanelModal.css';
import './StatsModal.css';

function formatWinPercentage(value) {
  const rounded = Number(value || 0).toFixed(1);
  return rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
}

/**
 * StatsModal - authenticated player statistics dashboard.
 *
 * @see WBS Task 9.4
 */
const StatsModal = ({
  isOpen,
  onClose,
  user,
  stats,
  isLoading,
  error,
  refetch,
  highlightAttempt,
}) => {
  useEffect(() => {
    if (isOpen && user) {
      refetch?.();
    }
  }, [isOpen, user, refetch]);

  if (!isOpen) return null;

  const distribution = stats?.guessDistribution || {};
  const maxDistribution = Math.max(1, ...Object.values(distribution));

  return (
    <div className="panel-overlay stats-overlay" onClick={onClose}>
      <div className="panel-modal stats-modal" onClick={(event) => event.stopPropagation()}>
        <div className="stats-header">
          <h2>Statistics</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        {!user && (
          <p className="stats-empty">Login to track your statistics</p>
        )}

        {user && isLoading && (
          <div className="stats-loading">
            <span className="stats-spinner" />
            <p>Loading statistics...</p>
          </div>
        )}

        {user && !isLoading && error && (
          <div className="stats-error">
            <p>{error}</p>
            <button type="button" onClick={refetch}>Retry</button>
          </div>
        )}

        {user && !isLoading && stats && (
          <>
            <div className="stats-summary-grid">
              <div>
                <span>Played</span>
                <strong>{stats.gamesPlayed}</strong>
              </div>
              <div>
                <span>Win %</span>
                <strong>{formatWinPercentage(stats.winPercentage)}</strong>
              </div>
              <div>
                <span>Current</span>
                <strong>{stats.currentStreak}</strong>
              </div>
              <div>
                <span>Max</span>
                <strong>{stats.maxStreak}</strong>
              </div>
            </div>

            <div className="stats-distribution">
              <h3>Guess Distribution</h3>
              {[1, 2, 3, 4, 5, 6].map((attempt) => {
                const count = distribution[String(attempt)] || 0;
                const width = count === 0 ? '0%' : `${Math.max(8, (count / maxDistribution) * 100)}%`;
                const isHighlight = Number(highlightAttempt) === attempt;

                return (
                  <div
                    key={attempt}
                    className={`stats-bar-row ${isHighlight ? 'stats-bar-row--highlight' : ''}`}
                  >
                    <span className="stats-bar-label">{attempt}</span>
                    <div className="stats-bar-track">
                      <div className="stats-bar-fill" style={{ width }}>
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsModal;
