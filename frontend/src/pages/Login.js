import React, { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import OtpInput from '../components/OtpInput';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { showAuthSuccessAlert, showErrorAlert, showInfoAlert } from '../utils/alerts';

import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(seconds - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Please enter your email address');

      await authAPI.sendOtp({ email: email.trim(), intent: 'login' });
      setOtpSent(true);
      setOtp('');
      setResendSeconds(20);
      showInfoAlert('OTP sent', `We sent an OTP to ${email.trim()}`, 'Continue');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to send OTP';
      const retryAfterSeconds = Number(err?.response?.data?.retryAfterSeconds || err?.retryAfterSeconds || 0);
      if (retryAfterSeconds > 0) setResendSeconds(retryAfterSeconds);
      setError(message);
      showErrorAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading || resendSeconds > 0) return;
    await handleSendOtp();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otpSent) throw new Error('Please request an OTP first.');
      if (!otp || otp.trim().length < 6) throw new Error('Please enter the 6-digit OTP.');

      const response = await authAPI.login({ email: email.trim(), code: otp.trim() });
      loginUser(response.data.user, response.data.token);

      showAuthSuccessAlert('Welcome back', 'Login successful', 'Start browsing').then(() => {
        navigate('/');
      });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'OTP verification failed';
      setError(message);
      showErrorAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--video">
      <video
        className="auth-page__video"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      >
        <source src="/images/loginPage.mp4" type="video/mp4" />
      </video>
      <div className="auth-page__overlay" aria-hidden="true" />
      <div className="auth-video-shell">
        <div className="auth-video-shell__intro">
          <span className="auth-video-shell__eyebrow">Private Access</span>
          <h1 className="auth-video-shell__title">Enter The Caliber experience</h1>
          <p className="auth-video-shell__copy">
            Use your email OTP to continue browsing collections, track orders, and save your
            watchlist across devices.
          </p>
        </div>

        <div className="auth-card auth-card--video">
          <div className="auth-header">
            <div className="auth-logo" aria-label="Caliber Watch">
              <img className="auth-logo__img" src="/assets/caliber-mark.svg" alt="Caliber Watch" />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-sub">Login with Email OTP</p>
          </div>

          <Card>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              {!otpSent && (
                <div className="auth-socialSection">
                  <GoogleAuthButton label="Continue with Google" />
                  <div className="auth-socialDivider">or continue with Email OTP</div>
                </div>
              )}

              {!otpSent ? (
                <Form onSubmit={(e) => e.preventDefault()}>
                  <div className="form-group-auth">
                    <Form.Label className="form-label">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button className="btn-rose" type="button" onClick={handleSendOtp} disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </Form>
              ) : (
                <Form onSubmit={handleVerifyOtp}>
                  <div className="form-group-auth">
                    <Form.Label className="form-label">OTP</Form.Label>
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      length={6}
                      disabled={loading}
                    />
                    <Form.Text muted>Check your email inbox for the code.</Form.Text>
                    <div className="auth-otpMeta">
                      <button
                        type="button"
                        className="auth-resendLink"
                        disabled={loading || resendSeconds > 0}
                        onClick={handleResendOtp}
                      >
                        {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="auth-actions">
                    <Button className="btn-rose" type="submit" disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </Button>

                    <Button
                      variant="outline-secondary"
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                        setResendSeconds(0);
                      }}
                    >
                      Change email
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Login;
