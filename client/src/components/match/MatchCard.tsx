import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFestiveCharacter } from '@/lib/festive';
import { useAuth } from '@/hooks/useAuth';

interface MatchCardProps {
  recipient: {
    id: number;
    name: string;
    email: string;
  };
  animated?: boolean;
}

// Animation variants for staggered reveal
const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const }
  },
};

export function MatchCard({ recipient, animated = false }: MatchCardProps) {
  const { wishlistEnabled } = useAuth();
  const Wrapper = animated ? motion.div : 'div';
  const Item = animated ? motion.div : 'div';

  const wrapperProps = animated ? {
    variants: cardVariants,
    initial: 'hidden',
    animate: 'visible',
  } : {};

  const itemProps = animated ? { variants: itemVariants } : {};

  return (
    <Wrapper {...wrapperProps}>
      <Card className="relative w-full max-w-md overflow-hidden border-0 bg-[radial-gradient(120%_120%_at_30%_10%,#1a472a_0%,#0f2818_60%,#0a1f12_100%)] text-white shadow-2xl transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(26,71,42,0.5)]">
        {/* Decorative sparkles */}
        <div className="absolute top-4 right-4 text-[#f8b229]/60">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="absolute top-12 right-8 text-[#f8b229]/40">
          <Sparkles className="w-3 h-3" />
        </div>

        <CardHeader className="text-center pb-2 pt-8">
          <Item {...itemProps}>
            <Badge
              variant="secondary"
              className="w-fit mx-auto mb-6 bg-white/10 text-white/90 hover:bg-white/15 backdrop-blur-sm border border-white/10"
            >
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f8b229] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f8b229]"></span>
              </span>
              Secret Match Revealed
            </Badge>
          </Item>

          <Item {...itemProps}>
            {/* Avatar with glow effect */}
            <div className="relative mx-auto w-fit">
              {/* Glow behind avatar */}
              <div className="absolute inset-0 rounded-full bg-[#f8b229]/30 blur-xl scale-110" />
              <Avatar className="relative h-28 w-28 ring-4 ring-white/20 ring-offset-4 ring-offset-[#1a472a]" aria-label={`${recipient.name}'s avatar`}>
                <AvatarFallback className="bg-gradient-to-br from-[#2d5a3d] to-[#1a472a] text-white text-2xl font-semibold p-2">
                  <img
                    src={getFestiveCharacter(recipient.name)}
                    alt={recipient.name}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </AvatarFallback>
              </Avatar>
            </div>
          </Item>
        </CardHeader>

        <CardContent className="text-center pt-6 pb-2">
          <Item {...itemProps}>
            <p className="text-sm text-white/60 uppercase tracking-wider mb-2">
              You're buying a gift for
            </p>
          </Item>
          <Item {...itemProps}>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {recipient.name}
            </h2>
          </Item>
          <Item {...itemProps}>
            <p className="text-white/70 text-sm">
              Email: {recipient.email}
            </p>
          </Item>
        </CardContent>

        {wishlistEnabled && (
          <CardFooter className="pt-4 pb-8 px-6">
            <Item {...itemProps} className="w-full">
              <Button
                asChild
                className="w-full h-12 bg-gradient-to-r from-[#8b1538] to-[#c41e3a] hover:from-[#a01840] hover:to-[#d42a46] text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link to="/recipient" aria-label="View recipient's wishlist" className="flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5" />
                  View Their Wishlist
                </Link>
              </Button>
            </Item>
          </CardFooter>
        )}

        {/* Bottom decorative gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f8b229]/50 to-transparent" />
      </Card>
    </Wrapper>
  );
}
