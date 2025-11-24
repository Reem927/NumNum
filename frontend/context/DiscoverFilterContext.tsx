// frontend/context/DiscoverFilterContext.tsx
import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    ReactNode,
  } from 'react';
  
  export type DiscoverFilters = {
    categories: string[];        // cuisines: ["Japanese", "Indian", ...]
    minRating: number | null;    // 1–5 stars (optional)
    priceTier: string | null;    // "$", "$$", "$$$+" (optional / future)
  };
  
  type DiscoverFilterContextType = {
    filters: DiscoverFilters;
    setFilters: (filters: DiscoverFilters) => void;
    resetFilters: () => void;
  };
  
  const DiscoverFilterContext = createContext<
    DiscoverFilterContextType | undefined
  >(undefined);
  
  const defaultFilters: DiscoverFilters = {
    categories: [],
    minRating: null,
    priceTier: null,
  };
  
  export function DiscoverFilterProvider({ children }: { children: ReactNode }) {
    const [filters, setFiltersState] = useState<DiscoverFilters>(defaultFilters);
  
    const setFilters = (next: DiscoverFilters) => {
      setFiltersState(next);
    };
  
    const resetFilters = () => {
      setFiltersState(defaultFilters);
    };
  
    const value = useMemo(
      () => ({ filters, setFilters, resetFilters }),
      [filters]
    );
  
    return (
      <DiscoverFilterContext.Provider value={value}>
        {children}
      </DiscoverFilterContext.Provider>
    );
  }
  
  export function useDiscoverFilters() {
    const ctx = useContext(DiscoverFilterContext);
    if (!ctx) {
      throw new Error(
        'useDiscoverFilters must be used within a DiscoverFilterProvider'
      );
    }
    return ctx;
  }