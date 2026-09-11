"use client";
import React, { useState, useEffect } from 'react';
import { useAuth, Role } from '@/components/AuthProvider/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME, APP_LOGO } from '@/lib/constants';
import styles from './page.module.css';
import { SplashScreen } from '@/components/ui/SplashScreen';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ email, password, rememberMe });
      // Login handles the redirect internally
    } catch (e: any) {
      setError(e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (role: Role) => {
    setLoading(true);
    setError('');
    try {
      // In a real production environment, you might not have these hardcoded,
      // but per requirements, we are to provide synthetic demo accounts.
      let demoEmail = '';
      if (role === 'elderly') demoEmail = 'kamla@example.com';
      if (role === 'caregiver') demoEmail = 'caregiver@example.com';
      if (role === 'family') demoEmail = 'family@example.com';
      if (role === 'healthcare') demoEmail = 'doctor@example.com';
      
      await login({ email: demoEmail, password: 'password123', rememberMe: true });
      // Login handles the redirect internally
    } catch (err: any) {
      setError(err.message || 'Failed to switch role');
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoImageContainer}>
            <Image 
              src={APP_LOGO}
              alt={`${APP_NAME} Logo`}
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 className={styles.logo}>{APP_NAME}</h1>
          <p className={styles.subtitle}>Welcome back. Please sign in to continue.</p>
        </div>

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

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.actions}>
            <label className={styles.rememberMe}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading} 
              />
              Remember Me
            </label>
            <Link href="/forgot-password" className={styles.forgotPassword}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.divider}>Or quick sign in as (DEMO DATA)</div>

        <div className={styles.demoRoles}>
          <button className={styles.demoBtn} onClick={() => handleDemoSwitch('elderly')} disabled={loading}>👵 Elderly User</button>
          <button className={styles.demoBtn} onClick={() => handleDemoSwitch('family')} disabled={loading}>👨‍👩‍👧 Family Member</button>
          <button className={styles.demoBtn} onClick={() => handleDemoSwitch('caregiver')} disabled={loading}>🩺 Caregiver</button>
          <button className={styles.demoBtn} onClick={() => handleDemoSwitch('healthcare')} disabled={loading}>🏥 Healthcare Worker</button>
        </div>

        <div className={styles.registerLink}>
          New to {APP_NAME}? 
          <Link href="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
