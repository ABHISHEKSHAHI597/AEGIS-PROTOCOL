/**
 * Login Page
 * Role selector: Student, Faculty, Authority, Admin. Email domain validation.
 * Redirects to Register with pre-filled email when user does not exist.
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

/* Student, Faculty, Authority, Admin only – no Author (Grievance); Admin logs in here, does not register */
const LOGIN_ROLES = [
  { value: 'user', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'authority', label: 'Authority' },
  { value: 'admin', label: 'Admin' },
];

const STUDENTS_DOMAIN = 'students.iitmandi.ac.in';
const INSTITUTE_DOMAIN = 'iitmandi.ac.in';

const getEmailDomain = (email) => {
  const parts = (email || '').toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
};

const validateEmailForRole = (email, roleValue) => {
  const domain = getEmailDomain(email);
  if (!email || !domain) return { valid: false, message: 'Enter a valid email.' };
  if (roleValue === 'user') {
    if (domain !== STUDENTS_DOMAIN) return { valid: false, message: 'Students must use @students.iitmandi.ac.in' };
  } else {
    if (domain !== INSTITUTE_DOMAIN) return { valid: false, message: 'Faculty, Authority and Admin must use @iitmandi.ac.in' };
  }
  return { valid: true };
};

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginAs, setLoginAs] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const domainCheck = validateEmailForRole(email, loginAs);
    if (!domainCheck.valid) {
      setError(domainCheck.message);
      toast.error(domainCheck.message);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      const code = err.response?.data?.code;
      if (err.response?.status === 404 || code === 'USER_NOT_FOUND') {
        if (loginAs === 'user') {
          const params = new URLSearchParams({ email: email.trim() });
          navigate(`/register?${params.toString()}`, { replace: true });
          toast.info('No account found. Please complete registration.');
          return;
        }
        setError('No account found. Faculty, Authority and Admin accounts are created by the administrator.');
        toast.error('No account found for this role.');
        return;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-tagline">Sign in to your Campus Portal account</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label>I am logging in as</label>
            <select
              className="auth-select"
              value={loginAs}
              onChange={(e) => setLoginAs(e.target.value)}
              aria-label="User type"
            >
              {LOGIN_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={loginAs === 'user' ? 'you@students.iitmandi.ac.in' : 'you@iitmandi.ac.in'}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};
