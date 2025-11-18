import React, { createContext, useContext, useState } from 'react';

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: string;
  image: any;
  addedAt?: Date;
  isFavorited?: boolean; // ✅ added this
};

type SavedListContextType = {
  saved: Restaurant[];
  toggleSave: (restaurant: Restaurant) => void;
  toggleFavorite: (id: string) => void; // ✅ added
  isSaved: (id: string) => boolean;
  isFavorited: (id: string) => boolean; // ✅ added
};

const SavedListContext = createContext<SavedListContextType | null>(null);

export const SavedListProvider = ({ children }: { children: React.ReactNode }) => {
  const [saved, setSaved] = useState<Restaurant[]>([]);

  // ✅ Toggle Save / Unsave
  const toggleSave = (restaurant: Restaurant) => {
    setSaved((prev) => {
      const exists = prev.find((r) => r.id === restaurant.id);
      if (exists) {
        return prev.filter((r) => r.id !== restaurant.id);
      }
      return [...prev, { ...restaurant, addedAt: new Date(), isFavorited: false }];
    });
  };

  // ✅ Toggle Favorite
  const toggleFavorite = (id: string) => {
    setSaved((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isFavorited: !r.isFavorited } : r
      )
    );
  };

  // ✅ Check if saved
  const isSaved = (id: string) => saved.some((r) => r.id === id);

  // ✅ Check if favorited
  const isFavorited = (id: string) => {
    const item = saved.find((r) => r.id === id);
    return item?.isFavorited ?? false;
  };

  return (
    <SavedListContext.Provider
      value={{
        saved,
        toggleSave,
        toggleFavorite,
        isSaved,
        isFavorited,
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
