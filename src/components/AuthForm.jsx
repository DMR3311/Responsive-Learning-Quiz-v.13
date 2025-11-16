import { useState } from 'react';
import { loginOrRegister } from '../utils/wpAuth';

export function AuthForm({ onAuthSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name || !email) {
        throw new Error('Please provide both name and email');
      }

      const { user, token } = await loginOrRegister(name, email);

      const userData = {
        id: user.id,
        name: user.name || name,
        email: user.email || email,
        token: token || null,
        isGuest: false,
      };

      localStorage.setItem('blueprint_user', JSON.stringify(userData));
      onAuthSuccess(false, true);
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/braintrain logo.png" alt="Braintrain Labs" className="auth-braintrain-logo" />
        </div>
        <h1>Welcome to Braintrain Labs</h1>
        <p className="auth-subtitle">Unlock your cognitive potential with our <strong>Responsive Learning Machine</strong></p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full auth-start-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Begin Your Journey'}
          </button>
        </form>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">🎯</div>
            <span>Adaptive Assessment</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">📊</div>
            <span>Detailed Analytics</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">🏆</div>
            <span>Track Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
