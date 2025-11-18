import { supabase } from '@/lib/supabase';

class RestaurantService {
  async getAllRestaurants({ limit = 20 }: { limit?: number } = {}) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getPersonalizedRestaurants(userId: string, limit = 20) {
    const { data, error } = await supabase.rpc('get_personalized_restaurants', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) throw error;
    return data ?? [];
  }
}

export const restaurantService = new RestaurantService();

