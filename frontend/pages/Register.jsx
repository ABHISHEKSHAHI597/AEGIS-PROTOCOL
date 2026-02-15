/**
 * Register Page – Students only.
 * Admins/Faculty/Authority do not register; they log in directly.
 * Pre-fills email when redirected from login (user not found).
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const STUDENTS_DOMAIN = 'students.iitmandi.ac.in';

const getEmailDomain = (email) => {
  const parts = (email || '').toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
};

const validateStudentEmail = (email) => {
  const domain = getEmailDomain(email);
  if (!email || !domain) return { valid: false, message: 'Enter a valid email.' };
  if (domain !== STUDENTS_DOMAIN) {
    return { valid: false, message: 'Only @students.iitmandi.ac.in emails can register as students.' };
  }
  return { valid: true };
};

export const Register = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fromLoginRedirect, setFromLoginRedirect] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
      setFromLoginRedirect(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const domainCheck = validateStudentEmail(email);
    if (!domainCheck.valid) {
      setError(domainCheck.message);
      toast.error(domainCheck.message);
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, 'user');
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Student registration</h1>
        <p className="auth-tagline">Create an account with your IIT Mandi student email</p>
        {fromLoginRedirect && (
          <p className="auth-info-msg">No account was found for this email. Complete the form to register as a student.</p>
        )}
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@students.iitmandi.ac.in"
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
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};
