"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../login/page.module.css';

export default function ForgotPasswordPage() {
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Sahayak AI';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    // Simulate API call for password reset
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Enter your email address to receive a password reset link.</p>
        </div>

        {success ? (
          <div className={styles.successMessage}>
            Password reset link sent to {email}. Please check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className={styles.resetBtn} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className={styles.loginLink}>
          <Link href="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
