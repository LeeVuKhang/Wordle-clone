import './Key.css';

const Key = ({ value, status, onClick, isWide }) => {
    const handleClick = () => {
        onClick(value);
    };

    return (
        <button
            className={`key ${status ? status : ''} ${isWide ? 'wide' : ''}`}
            onClick={handleClick}
        >
            {value}
        </button>
    );
};

export default Key;
