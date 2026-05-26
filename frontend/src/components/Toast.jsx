import './Toast.css';

/**
 * Toast — ephemeral notification (Task 8.10)
 * @param {{ message: string, type: 'info'|'warning'|'error'|'success' }} props
 */
const Toast = ({ message, type = 'info' }) => {
  if (!message) return null;
  return (
    <div className={`toast toast--${type}`} role="alert">
      {message}
    </div>
  );
};

export default Toast;
