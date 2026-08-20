import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { showAuthSuccessAlert, showErrorAlert } from '../utils/alerts';
import './Auth.css';

function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Unable to complete Google sign in. Please try again.');
      return;
    }

    sessionStorage.setItem('token', token);

    authAPI
      .getProfile()
      .then((response) => {
        loginUser(response.data, token);
        showAuthSuccessAlert('Welcome back', 'Signed in with Google successfully', 'Continue').then(() => {
          navigate('/');
        });
      })
      .catch((err) => {
        const message = err?.response?.data?.message || err?.message || 'Google sign in failed';
        setError(message);
        showErrorAlert('Authentication error', message);
      });
  }, [loginUser, navigate, searchParams]);

  return (
    <div className="auth-page auth-page--video">
      <div className="auth-page__overlay" aria-hidden="true" />
      <div className="auth-video-shell" style={{ justifyContent: 'center' }}>
        <div className="auth-card auth-card--video" style={{ maxWidth: '480px' }}>
          <div className="auth-header">
            <h1 className="auth-title">Google Sign In</h1>
            <p className="auth-sub">Completing your sign in now...</p>
          </div>
          <div className="auth-card__body" style={{ padding: '24px 0' }}>
            {error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                Redirecting to the store. If nothing happens, please try signing in again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleAuthCallback;
