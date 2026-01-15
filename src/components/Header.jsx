import './Header.css';

const Header = ({ onNewGame }) => {
    return (
        <header className="header">
            <div className="header-container">
                <h1 className="title">WORDLE</h1>
                <button className="new-game-btn" onClick={onNewGame}>
                    New Game
                </button>
            </div>
        </header>
    );
};

export default Header;
