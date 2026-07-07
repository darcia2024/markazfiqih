import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCartItems, addCartItem, removeCartItem } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

export type CartItem = {
  id: string;
  classId: string;
  addedAt: string;
  class: {
    id: string;
    title: string;
    coverImage: string;
    basePrice: number;
    discountPrice: number | null;
    instructor: { id: string; name: string; photoUrl: string };
    moduleCount: number;
    totalDurationMinutes: number;
  };
};

type CartContextType = {
  items: CartItem[];
  count: number;
  isLoading: boolean;
  classIdsInCart: Set<string>;
  addToCart: (classId: string) => Promise<void>;
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
    mutationFn: ({ classId }: { classId: string }) => addCartItem(user!.id, classId),
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
  const classIdsInCart = new Set(items.map((i) => i.classId));

  const addToCart = async (classId: string) => {
    if (!user) return;
    await addMutation.mutateAsync({ classId });
  };

  const removeFromCart = async (itemId: string) => {
    await removeMutation.mutateAsync({ itemId });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        isLoading: cartQuery.isLoading,
        classIdsInCart,
        addToCart,
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
