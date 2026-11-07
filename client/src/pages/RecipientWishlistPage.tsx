import { Gift, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useRecipientWishlist } from '@/hooks/useWishlist';
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFestiveCharacter } from '@/lib/festive';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';

export function RecipientWishlistPage() {
  const { language } = useAuth();
  const { items, recipientName, loading, error, refetch } = useRecipientWishlist();

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{translate(language, 'Gift Ideas')}</h1>
            {recipientName && (
              <div className="flex items-center gap-3 mt-3">
                <img
                  src={getFestiveCharacter(recipientName)}
                  alt={recipientName}
                  className="w-8 h-8 object-contain"
                />
                <p className="text-gray-200">
                  {translate(language, 'Shopping for')}{' '}
                  <span className="font-semibold text-[#f8b229]">{recipientName}</span>
                </p>
              </div>
            )}
          </div>
          <Badge
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <Gift className="w-3 h-3 mr-1" />
            {translate(language, 'Secret Santa')}
          </Badge>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f8b229]" />
            <p className="mt-4 text-gray-200">{translate(language, 'Loading wishlist...')}</p>
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{translate(language, 'Unable to load wishlist')}</AlertTitle>
            <AlertDescription className="mt-2">{error}</AlertDescription>
            <Button variant="outline" onClick={refetch} className="mt-4">
              {translate(language, 'Try Again')}
            </Button>
          </Alert>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon={Gift}
            title={translate(language, 'No items yet')}
            description={
              recipientName
                ? (language === 'fr'
                  ? `${recipientName} n’a pas encore ajouté d’articles à sa liste de cadeaux. Revenez bientôt !`
                  : `${recipientName} hasn't added any items to their wishlist yet. Check back soon!`)
                : translate(language, "Your recipient hasn't added any items to their wishlist yet. Check back soon!")
            }
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {language === 'fr'
                  ? `Liste de cadeaux de ${recipientName} (${items.length} ${items.length === 1 ? 'article' : 'articles'})`
                  : `${recipientName}'s Wishlist (${items.length} ${items.length === 1 ? 'item' : 'items'})`}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <WishlistItemCard key={item.id} item={item} canDelete={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
