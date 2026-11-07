import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingParticle } from './FloatingParticle';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';

interface RevealAnimationProps {
  recipientName: string;
  onComplete: () => void;
}

// Seeded random number generator for deterministic particle positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Generate particles with deterministic values
function generateParticles() {
  return Array.from({ length: 18 }, (_, i) => ({
    id: i,
    type: (i % 3 === 0 ? 'gift' : 'snowflake') as 'gift' | 'snowflake',
    delay: seededRandom(i * 3) * 1.5,
    duration: 2.5 + seededRandom(i * 3 + 1) * 1.5,
    startX: 5 + seededRandom(i * 3 + 2) * 90,
    size: 16 + seededRandom(i * 4) * 16,
    snowflakeIndex: i,
  }));
}

export function RevealAnimation({ recipientName, onComplete }: RevealAnimationProps) {
  const { language } = useAuth();
  // Use useState with lazy initializer - only runs once on mount
  const [particles] = useState(generateParticles);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative min-h-[400px] flex flex-col items-center justify-center overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/95 to-black/40 rounded-2xl" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <FloatingParticle key={particle.id} {...particle} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-8">
        {/* Intro text */}
        <motion.p
          className="text-primary-foreground/80 text-lg mb-4 font-sans"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {translate(language, 'Your Secret Santa match is...')}
        </motion.p>

        {/* Recipient name */}
        <motion.h1
          className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-md"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.5,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          {recipientName}
        </motion.h1>

        {/* Decorative underline */}
        <motion.div
          className="mt-4 h-1 bg-accent rounded-full mx-auto"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 120, opacity: 1 }}
          transition={{
            duration: 0.6,
            delay: 2.3,
            ease: 'easeOut'
          }}
        />

        {/* Subtitle */}
        <motion.p
          className="text-primary-foreground/60 text-sm mt-6 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.8 }}
        >
          {translate(language, 'Time to start shopping!')}
        </motion.p>
      </div>
    </div>
  );
}
