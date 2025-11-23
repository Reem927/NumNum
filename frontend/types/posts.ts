// types/posts.ts
export type PostType = 'review' | 'thread';

export interface Post {
  id: string;
  user_id: string;
  type: PostType;
  content: string;
  restaurant_id?: string; // Only for review posts
  rating?: number; // Only for review posts
  image_urls?: string[]; // Array of image URLs
  created_at: string;
  updated_at?: string;
  likes_count: number;
  comments_count: number;
  
  // Joined user data (from profiles)
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  
  // Joined restaurant data (for reviews)
  restaurant?: {
    id: string;
    name: string;
    cuisine?: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string; // For nested replies
  content: string;
  created_at: string;
  updated_at?: string;
  likes_count: number;
  
  // Joined user data
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  
  // Replies (nested comments)
  replies?: Comment[];
}

export interface Like {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}

export interface CreatePostData {
  type: PostType;
  content: string;
  restaurant_id?: string;
  rating?: number;
  image_urls?: string[];
}

export interface CreateCommentData {
  post_id: string;
  content: string;
  parent_id?: string; // For replies
}

