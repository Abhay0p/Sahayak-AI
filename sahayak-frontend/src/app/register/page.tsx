"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import styles from '../login/page.module.css';
import { apiClient } from '@/lib/apiClient';

const CustomRoleSelect = ({ value, onChange, disabled }: { value: string, onChange: any, disabled: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'elderly', label: 'Elderly User' },
    { value: 'family', label: 'Family Member' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'healthcare', label: 'Healthcare Worker' },
    { value: 'admin', label: 'Administrator' }
  ];

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const currentIndex = options.findIndex(o => o.value === value);
      let nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0) nextIndex = options.length - 1;
      if (nextIndex >= options.length) nextIndex = 0;
      onChange({ target: { name: 'role', value: options[nextIndex].value } });
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-color)',
          border: isOpen ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(100, 108, 255, 0.2)' : 'none'
        }}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 50,
            maxHeight: '300px',
            overflowY: 'auto',
            listStyle: 'none',
            padding: '0.5rem',
            margin: '0.5rem 0 0 0'
          }}
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange({ target: { name: 'role', value: opt.value } });
                setIsOpen(false);
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.background = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: value === opt.value ? 'var(--accent-color)' : 'transparent',
                color: '#ffffff',
                fontWeight: value === opt.value ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '20px', display: 'flex', alignItems: 'center' }}>
                {value === opt.value && <Check size={18} color="white" />}
              </div>
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function RegisterPage() {
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Sahayak AI';
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'elderly',
    gender: 'neutral',
    languagePreference: 'en'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string, value: string } }) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await apiClient('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>{APP_NAME}</h1>
          <p className={styles.subtitle}>Create your profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className={styles.input}
                placeholder="Kamla"
                value={formData.firstName}
                onChange={handleChange as any}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="lastName">Last Name (Optional)</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className={styles.input}
                placeholder="Devi"
                value={formData.lastName}
                onChange={handleChange as any}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange as any}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange as any}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label} id="role-label">I am a...</label>
              <CustomRoleSelect 
                value={formData.role} 
                onChange={handleChange} 
                disabled={loading} 
              />
            </div>
            
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label} style={{ textAlign: 'center', display: 'block', fontSize: '1.2rem', marginBottom: '1rem' }}>
                HOW SHOULD YOUR PROFILE APPEAR?
              </label>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '1.5rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: formData.gender === 'male' ? '3px solid var(--accent-color)' : '2px solid var(--border-color)',
                    background: formData.gender === 'male' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    transform: formData.gender === 'male' ? 'scale(1.05)' : 'scale(1)'
                  }}
                  aria-pressed={formData.gender === 'male'}
                >
                  <span style={{ fontSize: '2.5rem' }}>👨</span>
                  <span style={{ fontWeight: '600', color: formData.gender === 'male' ? 'var(--accent-color)' : 'var(--text-color)' }}>Male</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '1.5rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: formData.gender === 'female' ? '3px solid var(--accent-color)' : '2px solid var(--border-color)',
                    background: formData.gender === 'female' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    transform: formData.gender === 'female' ? 'scale(1.05)' : 'scale(1)'
                  }}
                  aria-pressed={formData.gender === 'female'}
                >
                  <span style={{ fontSize: '2.5rem' }}>👩</span>
                  <span style={{ fontWeight: '600', color: formData.gender === 'female' ? 'var(--accent-color)' : 'var(--text-color)' }}>Female</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: 'neutral' }))}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '1.5rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: formData.gender === 'neutral' ? '3px solid var(--accent-color)' : '2px solid var(--border-color)',
                    background: formData.gender === 'neutral' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    transform: formData.gender === 'neutral' ? 'scale(1.05)' : 'scale(1)'
                  }}
                  aria-pressed={formData.gender === 'neutral'}
                >
                  <span style={{ fontSize: '2.5rem' }}>👤</span>
                  <span style={{ fontWeight: '600', color: formData.gender === 'neutral' ? 'var(--accent-color)' : 'var(--text-color)' }}>Neutral</span>
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.registerLink}>
          Already have an account? 
          <Link href="/login">Sign in instead</Link>
        </div>
      </div>
    </div>
  );
}
