/**
 * Page loading skeleton
 */
import './PageSkeleton.css';

export const PageSkeleton = () => (
  <div className="page-skeleton">
    <div className="skeleton-header" />
    <div className="skeleton-cards">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  </div>
);
