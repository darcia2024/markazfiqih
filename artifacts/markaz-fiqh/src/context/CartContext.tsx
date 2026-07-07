import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCartItems, addCartItem, removeCartItem } from '@/lib/db';
import type { CartItem, CartClassItem, CartBundleItem } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

export type { CartItem, CartClassItem, CartBundleItem };

type CartContextType = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isLoading: boolean;
  classIdsInCart: Set<string>;
  bundleIdsInCart: Set<string>;
  addToCart: (classId: string) => Promise<void>;
  addBundleToCart: (bundleId: string) => Promise<void>;
  isAdding: boolean;
  removeFromCart: (itemId: string) => Promise<void>;
  isRemoving: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => listCartItems(user!.id),
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: (item: { classId: string } | { bundleId: string }) =>
      addCartItem(user!.id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
    onError: (error) => {
      console.error('Gagal menambahkan ke keranjang:', error);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
    onError: (error) => {
      console.error('Gagal menghapus dari keranjang:', error);
    },
  });

  const items: CartItem[] = cartQuery.data ?? [];

  const subtotal = items.reduce((sum, item) => {
    if (item.type === 'bundle') {
      return sum + item.bundle.bundlePrice;
    }
    return sum + (item.class.discountPrice ?? item.class.basePrice);
  }, 0);

  const classIdsInCart = new Set(
    items.filter((i): i is CartClassItem => i.type === 'class').map((i) => i.classId),
  );
  const bundleIdsInCart = new Set(
    items.filter((i): i is CartBundleItem => i.type === 'bundle').map((i) => i.bundleId),
  );

  const addToCart = async (classId: string) => {
    if (!user) return;
    await addMutation.mutateAsync({ classId });
  };

  const addBundleToCart = async (bundleId: string) => {
    if (!user) return;
    await addMutation.mutateAsync({ bundleId });
  };

  const removeFromCart = async (itemId: string) => {
    await removeMutation.mutateAsync({ itemId });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        subtotal,
        isLoading: cartQuery.isLoading,
        classIdsInCart,
        bundleIdsInCart,
        addToCart,
        addBundleToCart,
        isAdding: addMutation.isPending,
        removeFromCart,
        isRemoving: removeMutation.isPending,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
