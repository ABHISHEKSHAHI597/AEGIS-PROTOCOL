/**
 * Analytics Dashboard – Grievances by priority, department, escalation
 */
import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { getGrievanceAnalytics } from '../services/analyticsService';
import { useToast } from '../context/ToastContext';
import './Analytics.css';

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const d = await getGrievanceAnalytics();
        setData(d);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Layout><div className="container mt-4 flex-center">Loading...</div></Layout>;
  if (!data) return <Layout><div className="container mt-4">No data</div></Layout>;

  const byPriority = data.byPriority || {};
  const byDepartment = data.byDepartment || {};
  const byStatus = data.byStatus || {};
  const byEscalation = data.byEscalation || {};

  return (
    <Layout>
      <div className="container analytics-page">
        <h1>Analytics Dashboard</h1>
        <p className="analytics-subtitle">Grievance metrics by priority, department, status, and escalation</p>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>By Priority</h3>
            <ul>
              {['low', 'medium', 'high', 'critical'].map((p) => (
                <li key={p}>
                  <span className={`priority-dot priority-${p}`} />
                  {p}: {byPriority[p] ?? 0}
                </li>
              ))}
            </ul>
          </div>

          <div className="analytics-card">
            <h3>By Status</h3>
            <ul>
              {Object.entries(byStatus).map(([k, v]) => (
                <li key={k}>{k}: {v}</li>
              ))}
              {Object.keys(byStatus).length === 0 && <li>No data</li>}
            </ul>
          </div>

          <div className="analytics-card">
            <h3>By Department</h3>
            <ul>
              {Object.entries(byDepartment).map(([k, v]) => (
                <li key={k}>{k}: {v}</li>
              ))}
              {Object.keys(byDepartment).length === 0 && <li>No data</li>}
            </ul>
          </div>

          <div className="analytics-card">
            <h3>By Escalation Level</h3>
            <ul>
              {Object.entries(byEscalation).map(([k, v]) => (
                <li key={k}>{k}: {v}</li>
              ))}
              {Object.keys(byEscalation).length === 0 && <li>No data</li>}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};
