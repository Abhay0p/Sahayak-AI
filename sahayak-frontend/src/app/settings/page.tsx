'use client';

import React from 'react';
import Link from 'next/link';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { updateProfile } from '@/lib/profile';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';
import { ArrowLeft, Check } from 'lucide-react';
import styles from './page.module.css';

export default function Settings() {
  const { textSize, setTextSize, highContrast, setHighContrast } = useAccessibility();
  const { profile } = useUserProfile();

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/">
          <ElderlyButton variant="outline" icon={<ArrowLeft />}>
            Back
          </ElderlyButton>
        </Link>
        <h1 className={styles.title}>Accessibility Settings</h1>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Text Size</h2>
        <div className={styles.optionsGrid}>
          <button 
            className={`${styles.optionBtn} ${textSize === 'normal' ? styles.active : ''}`}
            onClick={() => setTextSize('normal')}
          >
            {textSize === 'normal' && <Check className={styles.checkIcon} />}
            <span style={{ fontSize: '18px' }}>Normal (18px)</span>
          </button>
          
          <button 
            className={`${styles.optionBtn} ${textSize === 'large' ? styles.active : ''}`}
            onClick={() => setTextSize('large')}
          >
            {textSize === 'large' && <Check className={styles.checkIcon} />}
            <span style={{ fontSize: '22px' }}>Large (22px)</span>
          </button>
          
          <button 
            className={`${styles.optionBtn} ${textSize === 'extra-large' ? styles.active : ''}`}
            onClick={() => setTextSize('extra-large')}
          >
            {textSize === 'extra-large' && <Check className={styles.checkIcon} />}
            <span style={{ fontSize: '26px' }}>Extra Large (26px)</span>
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Visual Comfort</h2>
        <div className={styles.optionsGrid}>
          <button 
            className={`${styles.optionBtn} ${highContrast ? styles.active : ''}`}
            onClick={() => setHighContrast(!highContrast)}
          >
            {highContrast && <Check className={styles.checkIcon} />}
            <span>High Contrast Mode</span>
          </button>
        </div>
      </section>

      {profile && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile Presentation (Avatar)</h2>
          <div className={styles.optionsGrid}>
            <button 
              className={`${styles.optionBtn} ${profile.gender === 'male' ? styles.active : ''}`}
              onClick={async () => {
                await updateProfile({ gender: 'male' });
                window.location.reload(); // Refresh to update profile images immediately across app
              }}
            >
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>👨</span>
              <span>Male</span>
            </button>
            <button 
              className={`${styles.optionBtn} ${profile.gender === 'female' ? styles.active : ''}`}
              onClick={async () => {
                await updateProfile({ gender: 'female' });
                window.location.reload();
              }}
            >
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>👩</span>
              <span>Female</span>
            </button>
            <button 
              className={`${styles.optionBtn} ${profile.gender === 'neutral' ? styles.active : ''}`}
              onClick={async () => {
                await updateProfile({ gender: 'neutral' });
                window.location.reload();
              }}
            >
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>👤</span>
              <span>Neutral</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
