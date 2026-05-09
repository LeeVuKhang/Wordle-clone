import ModeSwitch from './ModeSwitch';
import './Header.css';

/**
 * Header — app title, mode switcher, auth button
 *
 * WBS Tasks 8.2, 8.8
 */
const Header = ({ mode, onSwitchMode, user, onAuthClick, onLogout }) => {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="title">WORDLE</h1>

        <ModeSwitch mode={mode} onSwitch={onSwitchMode} />

        <div className="header-auth">
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
