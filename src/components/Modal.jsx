import './Modal.css';

const Modal = ({ isOpen, onClose, title, message, onAction, actionText }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">{title}</h2>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    {onAction && actionText && (
                        <button className="modal-btn primary" onClick={onAction}>
                            {actionText}
                        </button>
                    )}
                    <button className="modal-btn secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
