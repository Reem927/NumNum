-- Supabase Database Schema for Reviews, Threads, Comments, and Likes
-- Run this SQL in your Supabase SQL Editor

-- ========== REVIEWS TABLE ==========
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  rating NUMERIC(3, 2) CHECK (rating >= 0 AND rating <= 5),
  image_urls TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ========== THREADS TABLE ==========
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  cuisine TEXT,
  attached_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  image_urls TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Indexes for threads
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_cuisine ON threads(cuisine);
CREATE INDEX IF NOT EXISTS idx_threads_attached_review_id ON threads(attached_review_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);

-- ========== COMMENTS TABLE (FOR THREADS) ==========
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ========== LIKES TABLE (FOR THREADS) ==========
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure a like is either for a thread OR a comment, not both
  CONSTRAINT check_like_target CHECK (
    (thread_id IS NOT NULL AND comment_id IS NULL) OR
    (thread_id IS NULL AND comment_id IS NOT NULL)
  ),
  -- Ensure user can't like the same thread/comment twice
  CONSTRAINT unique_thread_like UNIQUE (user_id, thread_id) WHERE thread_id IS NOT NULL,
  CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id) WHERE comment_id IS NOT NULL
);

-- Indexes for likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_thread_id ON likes(thread_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);

-- ========== PROFILES TABLE (if it doesn't exist) ==========
-- Note: Adjust this based on your existing profiles table structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ========== RPC FUNCTIONS FOR THREADS ==========

-- Increment thread likes count
CREATE OR REPLACE FUNCTION increment_thread_likes(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE threads SET likes_count = likes_count + 1 WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement thread likes count
CREATE OR REPLACE FUNCTION decrement_thread_likes(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE threads SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment thread comments count
CREATE OR REPLACE FUNCTION increment_thread_comments(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE threads SET comments_count = comments_count + 1 WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement thread comments count
CREATE OR REPLACE FUNCTION decrement_thread_comments(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE threads SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== RPC FUNCTIONS FOR REVIEWS ==========

-- Increment review likes count
CREATE OR REPLACE FUNCTION increment_review_likes(review_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET likes_count = likes_count + 1 WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement review likes count
CREATE OR REPLACE FUNCTION decrement_review_likes(review_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment review comments count
CREATE OR REPLACE FUNCTION increment_review_comments(review_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET comments_count = comments_count + 1 WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement review comments count
CREATE OR REPLACE FUNCTION decrement_review_comments(review_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== ROW LEVEL SECURITY (RLS) POLICIES ==========

-- Enable RLS on all tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Threads policies
CREATE POLICY "Threads are viewable by everyone"
  ON threads FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own threads"
  ON threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
  ON threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads"
  ON threads FOR DELETE
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
