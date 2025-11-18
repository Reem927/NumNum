import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { socialService, SavedRestaurantRow } from '@/services/social';

// Keep backwards compatible with old image format
export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: string;
  image: any; // Can be require() or URL string
  addedAt?: Date;
  isFavorited?: boolean;
};

type SavedListContextType = {
  saved: Restaurant[];
  loading: boolean;
  toggleSave: (restaurant: Restaurant) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
  isFavorited: (id: string) => boolean;
  refreshSaved: () => Promise<void>;
};

const SavedListContext = createContext<SavedListContextType | null>(null);

export const SavedListProvider = ({ children }: { children: React.ReactNode }) => {
  const [saved, setSaved] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshSaved = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const savedRestaurants: SavedRestaurantRow[] = await socialService.getSavedRestaurants(user.id);
      
      // Convert to local format
      const formatted = savedRestaurants.map((sr) => ({
        id: sr.restaurant_id,
        name: sr.restaurant?.name || 'Restaurant',
        cuisine: sr.restaurant?.cuisine || '',
        rating: (sr.restaurant?.rating ?? 0).toString(),
        image: sr.restaurant?.image_url
          ? { uri: sr.restaurant.image_url }
          : require('@/assets/images/tatami.png'),
        addedAt: sr.added_at ? new Date(sr.added_at) : undefined,
        isFavorited: sr.is_favorited ?? false,
      }));
      
      setSaved(formatted);
    } catch (error) {
      console.error('Error loading saved restaurants:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshSaved();
    } else {
      setSaved([]);
    }
  }, [user, refreshSaved]);

  // Toggle Save / Unsave
  const toggleSave = async (restaurant: Restaurant) => {
    if (!user) {
      console.warn('User must be logged in to save restaurants');
      return;
    }

    const alreadySaved = isSaved(restaurant.id);
    
    try {
      if (alreadySaved) {
        // Remove from database
        await socialService.unsaveRestaurant(user.id, restaurant.id);
        setSaved((prev) => prev.filter((r) => r.id !== restaurant.id));
      } else {
        // Add to database
        await socialService.saveRestaurant(user.id, restaurant);
        setSaved((prev) => [...prev, { ...restaurant, addedAt: new Date(), isFavorited: false }]);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      // Optionally: show error to user
    }
  };

  // Toggle Favorite
  const toggleFavorite = async (id: string) => {
    if (!user) return;

    try {
      const nextValue = await socialService.toggleFavorite(user.id, id);
      setSaved((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isFavorited: nextValue } : r
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Check if saved
  const isSaved = (id: string) => saved.some((r) => r.id === id);

  // Check if favorited
  const isFavorited = (id: string) => {
    const item = saved.find((r) => r.id === id);
    return item?.isFavorited ?? false;
  };

  return (
    <SavedListContext.Provider
      value={{
        saved,
        loading,
        toggleSave,
        toggleFavorite,
        isSaved,
        isFavorited,
        refreshSaved,
      }}
    >
      {children}
    </SavedListContext.Provider>
  );
};

export const useSavedList = () => {
  const context = useContext(SavedListContext);
  if (!context) throw new Error('useSavedList must be used within SavedListProvider');
  return context;
};
