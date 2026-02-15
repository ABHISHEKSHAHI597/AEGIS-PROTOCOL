/**
 * Loading Spinner Component
 */
import './LoadingSpinner.css';

export const LoadingSpinner = ({ size = 'md' }) => (
  <div className={`spinner spinner-${size}`} role="status" aria-label="Loading">
    <span className="spinner-inner" />
  </div>
);
