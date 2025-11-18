import { supabase } from '@/lib/supabase';

export type SavedRestaurantRow = {
  id?: string;
  user_id: string;
  restaurant_id: string;
  added_at?: string;
  is_favorited?: boolean;
  restaurant?: {
    id: string;
    name: string;
    cuisine: string;
    rating?: number | null;
    image_url?: string | null;
  };
};

type RestaurantInput = {
  id: string;
  name: string;
  cuisine: string;
  rating?: string | number;
  image?: any;
};

class SocialService {
  async getSavedRestaurants(userId: string): Promise<SavedRestaurantRow[]> {
    const { data, error } = await supabase
      .from('saved_restaurants')
      .select('id,user_id,restaurant_id,added_at,is_favorited,restaurant:restaurants(*)')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async saveRestaurant(userId: string, restaurant: RestaurantInput) {
    await this.ensureRestaurantRecord(restaurant);

    const { error } = await supabase
      .from('saved_restaurants')
      .upsert(
        {
          user_id: userId,
          restaurant_id: restaurant.id,
          added_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,restaurant_id' }
      );

    if (error) throw error;
  }

  async unsaveRestaurant(userId: string, restaurantId: string) {
    const { error } = await supabase
      .from('saved_restaurants')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId);

    if (error) throw error;
  }

  async toggleFavorite(userId: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('saved_restaurants')
      .select('is_favorited')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (error) throw error;

    const nextValue = !(data?.is_favorited ?? false);

    const { error: updateError } = await supabase
      .from('saved_restaurants')
      .update({ is_favorited: nextValue })
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId);

    if (updateError) throw updateError;
    return nextValue;
  }

  private async ensureRestaurantRecord(restaurant: RestaurantInput) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurant.id)
      .maybeSingle();

    if (error) throw error;
    if (data) return;

    const ratingNumber =
      typeof restaurant.rating === 'string'
        ? parseFloat(restaurant.rating)
        : restaurant.rating ?? null;

    const imageUrl =
      typeof restaurant.image === 'string'
        ? restaurant.image
        : typeof restaurant.image === 'object' && restaurant.image?.uri
        ? restaurant.image.uri
        : null;

    const { error: insertError } = await supabase.from('restaurants').insert([
      {
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        rating: ratingNumber,
        image_url: imageUrl,
      },
    ]);

    if (insertError) throw insertError;
  }
}

export const socialService = new SocialService();

