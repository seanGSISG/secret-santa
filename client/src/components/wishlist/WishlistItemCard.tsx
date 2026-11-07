import { useState } from 'react';
import { ExternalLink, Trash2, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GiftPlaceholder } from '@/components/ui/GiftPlaceholder';
import type { WishlistItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';

interface WishlistItemCardProps {
  item: WishlistItem;
  canDelete?: boolean;
  onDelete?: (id: number) => void;
  deleting?: boolean;
}

export function WishlistItemCard({
  item,
  canDelete = false,
  onDelete,
  deleting = false,
}: WishlistItemCardProps) {
  const { language } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    if (onDelete && !deleting) {
      onDelete(item.id);
    }
  };

  const formatPrice = (price: string | null) => {
    if (!price) return null;
    // Remove any existing currency symbols and format
    const cleaned = price.replace(/[^0-9.,]/g, '');
    return cleaned ? `$${cleaned}` : null;
  };

  const displayPrice = formatPrice(item.price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="relative border-0 overflow-hidden group bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
        {/* Top gradient accent on hover */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a472a] via-[#8b1538] to-[#1a472a] transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Image container with enhanced styling */}
        <div className="aspect-square relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {item.imageUrl && !imgError ? (
            <motion.img
              src={item.imageUrl}
              alt={item.title || translate(language, 'Product image')}
              className="w-full h-full object-contain p-4"
              loading="lazy"
              onError={() => setImgError(true)}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <GiftPlaceholder />
          )}

          {/* Wishlist badge */}
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-[#1a472a]/90 text-white text-xs backdrop-blur-sm"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {translate(language, 'Wishlist Item')}
          </Badge>

          {/* Quick action overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-black/5 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {canDelete && onDelete && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-[#8b1538]/90 hover:bg-[#6d102c] backdrop-blur-sm shadow-lg"
                aria-label={translate(language, 'Delete item from wishlist')}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </motion.div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 min-h-[3rem] leading-snug">
            {item.title || translate(language, 'Amazon Product')}
          </h3>
          {displayPrice && (
            <div className="flex items-center gap-2 mt-3">
              <p className="text-xl font-bold text-[#1a472a]">{displayPrice}</p>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Amazon
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            asChild
            className="w-full h-11 bg-gradient-to-r from-[#1a472a] to-[#2d5a3d] hover:from-[#1a472a] hover:to-[#1a472a] text-white font-medium shadow-sm hover:shadow-md transition-all duration-300"
          >
            <a
              href={item.amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
              aria-label={translate(language, 'View on Amazon')}
            >
              <ExternalLink className="w-4 h-4" />
              {translate(language, 'View on Amazon')}
            </a>
          </Button>
        </CardFooter>

        {/* Bottom decorative element */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f8b229]/30 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      </Card>
    </motion.div>
  );
}
