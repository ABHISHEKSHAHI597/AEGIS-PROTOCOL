/**
 * Internships & Research Opportunities
 */
import { useState, useEffect } from 'react';
import { getOpportunities, applyOpportunity, postOpportunity } from '../services/opportunityService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './Opportunities.css';

const TYPES = ['Internship', 'Research'];

export const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', company: '', facultyName: '', type: 'Internship', stipend: '', deadline: '', eligibility: '', applyLink: '', description: '' });
  const [posting, setPosting] = useState(false);
  const { user, isAdmin, isFaculty } = useAuth();
  const toast = useToast();
  const canPost = isAdmin || isFaculty;

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data = await getOpportunities(typeFilter || undefined);
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load opportunities');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [typeFilter]);

  const handlePost = async (e) => {
    e?.preventDefault?.();
    if (!postForm.title?.trim() || !postForm.type) {
      toast.error('Title and type are required');
      return;
    }
    setPosting(true);
    try {
      await postOpportunity({
        title: postForm.title.trim(),
        company: postForm.company?.trim(),
        facultyName: postForm.facultyName?.trim(),
        type: postForm.type,
        stipend: postForm.stipend?.trim(),
        deadline: postForm.deadline || undefined,
        eligibility: postForm.eligibility?.trim(),
        applyLink: postForm.applyLink?.trim(),
        description: postForm.description?.trim(),
      });
      toast.success('Opportunity posted');
      setShowPostForm(false);
      setPostForm({ title: '', company: '', facultyName: '', type: 'Internship', stipend: '', deadline: '', eligibility: '', applyLink: '', description: '' });
      fetchOpportunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleApply = async (id) => {
    try {
      await applyOpportunity(id, 'applied');
      toast.success('Application recorded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
  };

  return (
    <Layout>
      <div className="container opportunities-page">
        <div className="opportunities-header">
          <div>
            <h1>Internships & Research</h1>
            <p className="subtitle">Explore opportunities and apply</p>
          </div>
          {canPost && (
            <button type="button" className="btn-primary" onClick={() => setShowPostForm(!showPostForm)}>
              {showPostForm ? 'Cancel' : '+ Post Opportunity'}
            </button>
          )}
        </div>

        {showPostForm && canPost && (
          <form onSubmit={handlePost} className="card opp-post-form">
            <h3>Post Opportunity</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select value={postForm.type} onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Company</label>
                <input value={postForm.company} onChange={(e) => setPostForm({ ...postForm, company: e.target.value })} placeholder="Company name" />
              </div>
              <div className="form-group">
                <label>Faculty Name</label>
                <input value={postForm.facultyName} onChange={(e) => setPostForm({ ...postForm, facultyName: e.target.value })} placeholder="For research" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Stipend</label>
                <input value={postForm.stipend} onChange={(e) => setPostForm({ ...postForm, stipend: e.target.value })} placeholder="e.g. 20k/month" />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input type="date" value={postForm.deadline} onChange={(e) => setPostForm({ ...postForm, deadline: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Eligibility</label>
              <input value={postForm.eligibility} onChange={(e) => setPostForm({ ...postForm, eligibility: e.target.value })} placeholder="Eligibility criteria" />
            </div>
            <div className="form-group">
              <label>Apply Link</label>
              <input value={postForm.applyLink} onChange={(e) => setPostForm({ ...postForm, applyLink: e.target.value })} placeholder="URL" type="url" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} rows={3} placeholder="Description" />
            </div>
            <button type="submit" className="btn-primary" disabled={posting}>{posting ? 'Posting...' : 'Post'}</button>
          </form>
        )}

        <div className="opportunities-filters">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : opportunities.length === 0 ? (
          <div className="empty-state">
            <p>No opportunities found.</p>
          </div>
        ) : (
          <div className="opportunities-grid">
            {opportunities.map((opp) => (
              <div key={opp._id} className="opportunity-card card">
                <h3>{opp.title}</h3>
                <span className="opp-type">{opp.type}</span>
                <p className="opp-meta">
                  {opp.company || opp.facultyName || '—'}
                  {opp.stipend && ` · ${opp.stipend}`}
                </p>
                {opp.deadline && (
                  <p className="opp-deadline">Deadline: {new Date(opp.deadline).toLocaleDateString()}</p>
                )}
                {opp.description && <p className="opp-desc">{opp.description.slice(0, 120)}...</p>}
                {opp.eligibility && <p className="opp-eligibility">{opp.eligibility}</p>}
                <div className="opp-actions">
                  {opp.applyLink && (
                    <a href={opp.applyLink} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                      Apply
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => handleApply(opp._id)}
                  >
                    Save / Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
