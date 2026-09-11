import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME, APP_TAGLINE, APP_LOGO } from '@/lib/constants';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [stage, setStage] = useState(0);
  const [hasError, setHasError] = useState(false);
  // Start as false (same on server & client) then update after mount to avoid hydration mismatch
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    // Shorter, unified animation timeline (max 2.5s)
    const timer = setTimeout(() => {
      setStage(1); // Start fade out
      setTimeout(onComplete, 500); // Complete after fade out
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // If reduced motion is preferred, bypass heavy animations and just show the static logo briefly
  const animationProps: any = prefersReducedMotion 
    ? { initial: { opacity: 1, scale: 1 }, animate: { opacity: 1, scale: 1 } }
    : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.8, ease: "easeOut" as const } };

  return (
    <AnimatePresence>
      {stage === 0 && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-color)', color: 'var(--text-primary)',
            textAlign: 'center', padding: '2rem'
          }}
        >
          <motion.div {...animationProps} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {!hasError ? (
              <div style={{ position: 'relative', width: '250px', height: '250px', marginBottom: '1.5rem' }}>
                <Image 
                  src={APP_LOGO} 
                  alt={`${APP_NAME} Logo`}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  onError={() => setHasError(true)}
                />
              </div>
            ) : (
              <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', letterSpacing: '-0.02em', margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>
                {APP_NAME}
              </h1>
            )}
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {APP_NAME}
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              {APP_TAGLINE}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
