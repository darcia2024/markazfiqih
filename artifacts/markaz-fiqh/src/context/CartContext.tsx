import React, { createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListCartItems,
  useAddCartItem,
  getListCartItemsQueryKey,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';

export type CartClassSummary = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  basePrice: number;
  discountPrice: number | null;
  status: 'draft' | 'published';
  level: 'pemula' | 'menengah' | 'lanjutan' | null;
  category: string | null;
  instructor: { id: string; name: string; photoUrl: string };
  moduleCount: number;
  totalDurationMinutes: number | null;
};

export type CartItem = {
  id: string;
  classId: string;
  addedAt: string;
  class: CartClassSummary;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  isLoading: boolean;
  classIdsInCart: Set<string>;
  addToCart: (classId: string) => Promise<void>;
  isAdding: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cartQuery = useListCartItems(
    { userId: user?.id ?? '' },
    { query: { enabled: !!user, queryKey: getListCartItemsQueryKey({ userId: user?.id ?? '' }) } },
  );

  const addMutation = useAddCartItem({
    mutation: {
      onSuccess: () => {
        if (user) {
          queryClient.invalidateQueries({ queryKey: getListCartItemsQueryKey({ userId: user.id }) });
        }
      },
    },
  });

  const items = ((cartQuery.data ?? []) as unknown as CartItem[]);
  const classIdsInCart = new Set(items.map((i) => i.classId));

  const addToCart = async (classId: string) => {
    if (!user) return;
    await addMutation.mutateAsync({ data: { userId: user.id, classId } });
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
