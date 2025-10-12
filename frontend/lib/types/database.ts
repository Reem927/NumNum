export type Tag = {
    id: number;
    name: string;
}

export type Restaurant = {
    id: string;
    name: string;
    city: string | null;
    country: string;
    address: string;
    rating: number | null;
    price_level: number | null;
    photo_url?: string;
    url?: string;
    attrs?: Record<string, any>;
    created_at?: string;
    tags?: Tag[];
}

export type RestaurantTag = {
    restaurant_id: string;
    tag_id: number;
}
