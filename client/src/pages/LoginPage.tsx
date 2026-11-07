import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Gift, Sparkles, TreePine } from 'lucide-react';
import { FestiveParade } from '@/components/layout/FestiveParade';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { EventMilestones } from '@/components/layout/EventMilestones';
import { SpendingLimit } from '@/components/layout/SpendingLimit';
import { translate } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

// Animation variants for staggered reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  },
};

export function LoginPage() {
  const { wishlistEnabled, config, language } = useAuth();

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left panel - Festive gradient with enhanced visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-[radial-gradient(ellipse_at_top_left,#1a472a_0%,#0f2818_50%,#0a1f12_100%)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 text-[#f8b229]/40">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute top-20 right-20 text-[#f8b229]/30">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="absolute bottom-40 right-10 text-[#f8b229]/20">
          <Gift className="w-12 h-12" />
        </div>

        {/* Glowing orb effect */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#f8b229]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-[#8b1538]/20 rounded-full blur-3xl" />

        {/* Welcome content */}
        <div className="relative z-10 flex flex-col items-start justify-center px-16 text-white h-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-lg"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <TreePine className="w-8 h-8 text-[#f8b229]" />
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl xl:text-6xl font-serif font-bold mb-6 tracking-tight text-[#f4edda] leading-tight"
            >
              {config.gameTitle}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-white/80 leading-relaxed mb-8"
            >
              {config.subtitle[language]}
            </motion.p>

            <motion.div variants={itemVariants} className="flex items-center gap-4 text-white/60 text-sm">
              {config.milestones.length > 0 ? (
                <EventMilestones />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#f8b229] rounded-full animate-pulse" />
                  <span>{translate(language, 'Find your match')}</span>
                </div>
              )}
              {wishlistEnabled && (
                <>
                  {config.milestones.length === 0 && <div className="w-px h-4 bg-white/20" />}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#f8b229] rounded-full animate-pulse" />
                    <span>{translate(language, 'Build your wishlist')}</span>
                  </div>
                </>
              )}
              {config.milestones.length === 0 && (
                <>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#f8b229] rounded-full animate-pulse" />
                    <span>{translate(language, 'Spread joy')}</span>
                  </div>
                </>
              )}

            </motion.div>
            <motion.div variants={itemVariants} className="mt-4 text-[#f4edda]">
              <SpendingLimit className="text-[#f4edda]" />
            </motion.div>
          </motion.div>
        </div>

        {/* Festive Parade */}
        <FestiveParade className="absolute bottom-0 left-0" />

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f8b229]/50 to-transparent" />
      </div>

      {/* Right panel - Login form with enhanced card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative px-6 py-12 bg-gradient-to-br from-[#faf8f5] to-[#f5f0eb]">
        {/* Subtle decorative elements on light side */}
        <div className="absolute top-10 right-10 text-[#1a472a]/10">
          <Gift className="w-16 h-16" />
        </div>
        <div className="absolute bottom-20 left-10 text-[#1a472a]/5">
          <TreePine className="w-24 h-24" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' as const }}
          className="w-full max-w-md relative z-10"
        >
          <div className="mb-6 text-center lg:hidden">
            <h1 className="font-serif text-3xl font-bold text-[#1a472a]">{config.gameTitle}</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{config.subtitle[language]}</p>
          </div>
          <Card className="border-0 shadow-2xl backdrop-blur-md bg-white/95 overflow-hidden">
            {/* Card top accent */}
            <div className="h-1.5 bg-gradient-to-r from-[#1a472a] via-[#8b1538] to-[#1a472a]" />

            <CardHeader className="space-y-1 pt-8 pb-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="text-3xl font-serif text-center text-[#1a472a]">
                  {translate(language, 'Join the Secret Santa')}
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-center text-gray-500">
                  {translate(language, 'Create your account to receive your match by email.')}
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="pt-4 pb-8">
              <Button asChild className="mb-6 h-12 w-full bg-[#8b1538] text-base hover:bg-[#6d102c]">
                <Link to="/inscription">{translate(language, 'Create my account')}</Link>
              </Button>
              <p className="mb-4 text-center text-sm text-gray-500">
                {translate(language, 'Already registered? Sign in')}
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <LoginForm />
              </motion.div>
            </CardContent>
          </Card>

          <div className="mt-5 flex justify-center lg:hidden">
            <SpendingLimit className="text-[#8b1538]" />
          </div>

          {/* Trust indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-xs text-gray-400 mt-6"
          >
            {translate(language, 'Your information stays private.')}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
