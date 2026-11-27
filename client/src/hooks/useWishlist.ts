import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { WishlistItem } from '@/types';

/** An item as the server returns it. A warning means that the shop did not send the product details. */
export type AddedWishlistItem = WishlistItem & { warning?: string };

interface UseWishlistReturn {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  addItem: (amazonUrl: string) => Promise<AddedWishlistItem>;
  deleteItem: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useWishlist(): UseWishlistReturn {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<WishlistItem[]>('/wishlist');
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load wishlist');
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addItem = useCallback(async (amazonUrl: string): Promise<AddedWishlistItem> => {
    setError(null);
    try {
      const newItem = await api.post<AddedWishlistItem>('/wishlist', { amazonUrl });
      setItems((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add item');
      }
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (id: number) => {
    setError(null);
    try {
      await api.delete(`/wishlist/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete item');
      }
      throw err;
    }
  }, []);

  return {
    items,
    loading,
    error,
    addItem,
    deleteItem,
    refetch: fetchWishlist,
  };
}

interface UseRecipientWishlistReturn {
  items: WishlistItem[];
  recipientName: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecipientWishlist(): UseRecipientWishlistReturn {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipientWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ recipient: { name: string }; items: WishlistItem[] }>(
        '/wishlist/recipient'
      );
      setItems(data.items);
      setRecipientName(data.recipient.name);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load recipient wishlist');
      }
      setItems([]);
      setRecipientName('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipientWishlist();
  }, [fetchRecipientWishlist]);

  return {
    items,
    recipientName,
    loading,
    error,
    refetch: fetchRecipientWishlist,
  };
}
