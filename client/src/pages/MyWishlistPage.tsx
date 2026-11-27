import { useState } from 'react';
import { Gift, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { characters } from '@/assets/characters';
import { PageContainer } from '@/components/layout/PageContainer';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistForm } from '@/components/wishlist/WishlistForm';
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function MyWishlistPage() {
  const { items, loading, error, addItem, deleteItem, refetch } = useWishlist();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAdd = async (url: string) => {
    const item = await addItem(url);
    if (item.warning) {
      toast.info(item.warning);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteItem(id);
    } catch {
      // Error is already handled by the hook
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">My Wishlist</h1>
            <img src={characters.rudolph} className="h-10 w-10 object-contain animate-bounce-slow" alt="Rudolph" />
          </div>
          <p className="text-gray-200 mt-2">
            Add Amazon products you'd love to receive this Secret Santa season
          </p>
        </div>

        <WishlistForm onAdd={handleAdd} />

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f8b229]" />
            <p className="mt-4 text-gray-200">Loading your wishlist...</p>
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load wishlist</AlertTitle>
            <AlertDescription className="mt-2">{error}</AlertDescription>
            <Button variant="outline" onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </Alert>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon={Gift}
            title="Your wishlist is empty"
            description="Add some Amazon products above to help your Secret Santa find the perfect gift!"
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              🎁 My Items ({items.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  canDelete
                  onDelete={handleDelete}
                  deleting={deletingId === item.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
