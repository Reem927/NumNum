import { supabase } from '@/lib/supabase';
import type { Restaurant } from '@/lib/types/database';
import { useEffect, useState } from 'react';

const MOCK: Restaurant[] = [
  {
    id: 'm1',
    name: 'Mock Sushi',
    city: 'Tempe',
    country: 'USA',
    address: '101 College Ave',
    rating: 4.6,
    price_level: 2,
    photo_url: 'https://example.com/sushi.jpg',
    url: 'https://numnum.app/mock-sushi',
    attrs: { cuisine: 'Japanese', vibes: ['cozy', 'casual'] },
    tags: [{ id: 1, name: 'Japanese' }, { id: 2, name: 'Cozy' }]
  },
  {
    id: 'm2',
    name: 'Mock Tacos',
    city: 'Tempe',
    country: 'USA',
    address: '234 Mill Ave',
    rating: 4.2,
    price_level: 1,
    photo_url: 'https://example.com/tacos.jpg',
    url: 'https://numnum.app/mock-tacos',
    attrs: { cuisine: 'Mexican', vibes: ['quick', 'outdoor'] },
    tags: [{ id: 3, name: 'Mexican' }, { id: 4, name: 'Outdoor' }]
  }
];

export function useRestaurants(limit = 20) {
    const [data, setData] = useState<Restaurant[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setErr(null);
            const { data, error } = await supabase
                .from("restaurants")
                .select('id,name,city,rating,price_level,photo_url')
                .order('rating', { ascending: false})
                .limit(limit)

            if (cancelled) return;
            if (error) {
                setErr(error.message);
                setData(MOCK);
            } else {
                setData((data?.length ?? 0) > 0 ? data as Restaurant[] : MOCK);
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [limit]);

    return { data, loading, err };
}