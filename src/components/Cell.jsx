import './Cell.css';

const Cell = ({ value, status }) => {
    return (
        <div className={`cell ${status ? status : ''}`}>
            {value}
        </div>
    );
};

export default Cell;
