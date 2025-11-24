import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// One saved restaurant in the app
export type SavedRestaurant = {
  id: string;            // restaurant_id from restaurants table
  name: string;
  cuisine: string;
  rating: string;
  image: any;            // require(...) or { uri: string }
  isFavorite: boolean;
  addedAt?: string;
};

// Fallback local images by cuisine – same logic as DiscoverScreen
const CUISINE_IMAGE_MAP: Record<string, any> = {
  Japanese: require('@/assets/images/tatami.png'),
  Lebanese: require('@/assets/images/arabica.png'),
  Italian: require('@/assets/images/tatami.png'),
  American: require('@/assets/images/arabica.png'),
  French: require('@/assets/images/arabica.png'),
  Mexican: require('@/assets/images/tatami.png'),
  Korean: require('@/assets/images/tatami.png'),
  Chinese: require('@/assets/images/arabica.png'),
  Indian: require('@/assets/images/tatami.png'),
  British: require('@/assets/images/arabica.png'),
};

const DEFAULT_IMAGE = require('@/assets/images/tatami.png');

function getFallbackImage(cuisine?: string | null) {
  if (!cuisine) return DEFAULT_IMAGE;
  return CUISINE_IMAGE_MAP[cuisine] ?? DEFAULT_IMAGE;
}

type SavedListContextType = {
  saved: SavedRestaurant[];          // 👈 matches your SavedList.tsx
  favorites: string[];               // restaurant ids
  loading: boolean;
  isSaved: (restaurantId: string) => boolean;
  isFavorited: (restaurantId: string) => boolean; // 👈 new, for the star icon
  toggleSave: (restaurant: {
    id: string;
    name: string;
    cuisine: string;
    rating: string;
    image: any;
  }) => Promise<void>;
  toggleFavorite: (restaurantId: string) => Promise<void>;
};

const SavedListContext = createContext<SavedListContextType | undefined>(undefined);

export const SavedListProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState<SavedRestaurant[]>([]);
  const [loading, setLoading] = useState(false);

  const favorites = useMemo(
    () => saved.filter((r) => r.isFavorite).map((r) => r.id),
    [saved]
  );

  const isSaved = (restaurantId: string) =>
    saved.some((r) => r.id === restaurantId);

  // used by SavedList.tsx to decide star vs star-outline
  const isFavorited = (restaurantId: string) => {
    const item = saved.find((r) => r.id === restaurantId);
    return !!item?.isFavorite;
  };

  // Fetch saved restaurants whenever the user changes
  useEffect(() => {
    const fetchSaved = async () => {
      if (!user) {
        setSaved([]);
        return;
      }

      setLoading(true);

      // Get the actual authenticated user from Supabase to ensure we have a valid UUID
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (!supabaseUser) {
        setSaved([]);
        setLoading(false);
        return;
      }

      // Join saved_restaurants with restaurants table
      const { data, error } = await supabase
        .from('saved_restaurants')
        .select('restaurant_id, is_favorited, added_at, restaurants (*)')
        .eq('user_id', supabaseUser.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved restaurants:', error);
        setSaved([]);
        setLoading(false);
        return;
      }

      const mapped: SavedRestaurant[] =
        (data as any[])?.map((row) => {
          const rest = row.restaurants;

          return {
            id: row.restaurant_id,
            name: rest?.name ?? 'Unknown',
            cuisine: rest?.cuisine ?? 'Unknown',
            rating:
              rest?.rating !== null && rest?.rating !== undefined
                ? String(rest.rating)
                : '0.0',
            image: rest?.image_url
              ? { uri: rest.image_url }
              : getFallbackImage(rest?.cuisine),
            isFavorite: row.is_favorited ?? false,
            addedAt: row.added_at,
          };
        }) ?? [];

      setSaved(mapped);
      setLoading(false);
    };

    fetchSaved();
  }, [user]);

  // Toggle save / unsave
  const toggleSave = async (restaurant: {
    id: string;
    name: string;
    cuisine: string;
    rating: string;
    image: any;
  }) => {
    if (!user) {
      console.warn('User must be logged in to save restaurants.');
      return;
    }

    // Get the actual authenticated user from Supabase
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (!supabaseUser) {
      console.warn('User must be authenticated with Supabase.');
      return;
    }

    const restaurantId = restaurant.id;

    // If already saved → delete from Supabase
    const existing = saved.find((r) => r.id === restaurantId);

    if (existing) {
      const { error } = await supabase
        .from('saved_restaurants')
        .delete()
        .eq('user_id', supabaseUser.id)
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error('Error removing saved restaurant:', error);
        return;
      }

      setSaved((prev) => prev.filter((r) => r.id !== restaurantId));
      return;
    }

    // Not saved yet → insert into Supabase
    const { data, error } = await supabase
      .from('saved_restaurants')
      .insert({
        user_id: supabaseUser.id,
        restaurant_id: restaurantId,
        is_favorited: false,
      })
      .select('restaurant_id, is_favorited, added_at');

    if (error) {
      console.error('Error saving restaurant:', error);
      return;
    }

    const row = data?.[0];

    const newSaved: SavedRestaurant = {
      id: row.restaurant_id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      image: restaurant.image,
      isFavorite: row.is_favorited ?? false,
      addedAt: row.added_at,
    };

    setSaved((prev) => [newSaved, ...prev]);
  };

  // Toggle favorite on an already-saved restaurant
  const toggleFavorite = async (restaurantId: string) => {
    if (!user) {
      console.warn('User must be logged in to favorite restaurants.');
      return;
    }

    // Get the actual authenticated user from Supabase
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (!supabaseUser) {
      console.warn('User must be authenticated with Supabase.');
      return;
    }

    const existing = saved.find((r) => r.id === restaurantId);
    if (!existing) {
      console.warn('Cannot favorite a restaurant that is not in saved list.');
      return;
    }

    const newFavoriteValue = !existing.isFavorite;

    const { error } = await supabase
      .from('saved_restaurants')
      .update({ is_favorited: newFavoriteValue })
      .eq('user_id', supabaseUser.id)
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Error toggling favorite:', error);
      return;
    }

    setSaved((prev) =>
      prev.map((r) =>
        r.id === restaurantId ? { ...r, isFavorite: newFavoriteValue } : r
      )
    );
  };

  const value: SavedListContextType = {
    saved,
    favorites,
    loading,
    isSaved,
    isFavorited,
    toggleSave,
    toggleFavorite,
  };

  return <SavedListContext.Provider value={value}>{children}</SavedListContext.Provider>;
};

export const useSavedList = () => {
  const ctx = useContext(SavedListContext);
  if (!ctx) {
    throw new Error('useSavedList must be used within a SavedListProvider');
  }
  return ctx;
};
