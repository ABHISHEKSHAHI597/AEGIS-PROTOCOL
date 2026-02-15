/**
 * Register Page
 * Role: Student, Faculty, Authority, Admin. Email domain validation.
 * Pre-fills email (and role) when redirected from login (user not found).
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const REGISTER_ROLES = [
  { value: 'user', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'authority', label: 'Authority' },
  { value: 'author', label: 'Author (submit & view own grievances)' },
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
    if (domain !== INSTITUTE_DOMAIN) return { valid: false, message: 'Faculty, Authority and Author must use @iitmandi.ac.in' };
  }
  return { valid: true };
};

export const Register = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fromLoginRedirect, setFromLoginRedirect] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    const prefillRole = searchParams.get('role');
    if (prefillEmail) {
      setEmail(prefillEmail);
      setFromLoginRedirect(true);
    }
    if (prefillRole && ['user', 'faculty', 'authority', 'admin'].includes(prefillRole)) {
      setRole(prefillRole === 'admin' ? 'user' : prefillRole);
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
    const domainCheck = validateEmailForRole(email, role);
    if (!domainCheck.valid) {
      setError(domainCheck.message);
      toast.error(domainCheck.message);
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, role);
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
        <h1>Create account</h1>
        <p className="auth-tagline">Join the Campus Portal</p>
        {fromLoginRedirect && (
          <p className="auth-info-msg">No account was found for this email. Complete the form to register.</p>
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
              placeholder={role === 'user' ? 'you@students.iitmandi.ac.in' : 'you@iitmandi.ac.in'}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>I am a</label>
            <select className="auth-select" value={role} onChange={(e) => setRole(e.target.value)}>
              {REGISTER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
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
