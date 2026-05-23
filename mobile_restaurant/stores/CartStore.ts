import { create } from 'zustand';
import type { FoodModel } from '../models/FoodModels';

export interface CartItem {
  food: FoodModel;
  quantity: number;
  note?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (food: FoodModel, quantity?: number, note?: string) => void;
  removeItem: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  get totalPrice(): number;
  get totalItems(): number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (food, quantity = 1, note) => {
    set((state) => {
      const existing = state.items.find((item) => item.food.id === food.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.food.id === food.id
              ? { ...item, quantity: item.quantity + quantity, note: note ?? item.note }
              : item
          ),
        };
      }
      return { items: [...state.items, { food, quantity, note }] };
    });
  },

  removeItem: (foodId) => {
    set((state) => ({
      items: state.items.filter((item) => item.food.id !== foodId),
    }));
  },

  updateQuantity: (foodId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(foodId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.food.id === foodId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  get totalPrice() {
    return get().items.reduce((total, item) => total + item.food.price * item.quantity, 0);
  },

  get totalItems() {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));
