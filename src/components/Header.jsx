import ModeSwitch from './ModeSwitch';
import './Header.css';

/**
 * Header — app title, mode switcher, auth button
 *
 * WBS Tasks 8.2, 8.8
 */
const Header = ({ mode, onSwitchMode, user, onAuthClick, onLogout }) => {
  const activeModeLabel = mode === 'daily' ? 'Daily' : 'Practice';

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-side header-side--left" aria-hidden="true">
          <span className="header-pill">{activeModeLabel}</span>
        </div>

        <div className="brand-panel">
          <a className="brand-link" href="/" aria-label="Wordle Clone home">
            <span className="title">Wordle</span>
            <span className="title-subtitle">Clone</span>
          </a>

          <ModeSwitch mode={mode} onSwitch={onSwitchMode} />
        </div>

        <div className="header-side header-auth">
          {user ? (
            <div className="header-user">
              <span className="header-username">
                {user.username || user.email.split('@')[0]}
              </span>
              <button className="header-btn header-btn--ghost" onClick={onLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <button
              id="header-login-btn"
              className="header-btn header-btn--primary"
              onClick={onAuthClick}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
