-- Migration Script: Remove posts table (reviews already exists)
-- Run this in Supabase SQL Editor
-- Since posts table has no data and reviews already exists, we can simply drop posts

-- ========== STEP 1: Drop posts table ==========
-- Since posts table is empty and reviews already exists, we can drop it
DROP TABLE IF EXISTS posts CASCADE;

-- ========== STEP 2: Ensure threads.attached_review_id references reviews ==========
-- Verify the foreign key constraint is correct (should already be set)
-- If it's not set correctly, uncomment the following:
-- ALTER TABLE threads 
--   DROP CONSTRAINT IF EXISTS threads_attached_review_id_fkey;
-- 
-- ALTER TABLE threads
--   ADD CONSTRAINT threads_attached_review_id_fkey 
--   FOREIGN KEY (attached_review_id) 
--   REFERENCES reviews(id) ON DELETE SET NULL;

-- ========== STEP 3: Ensure RPC functions exist for reviews ==========
CREATE OR REPLACE FUNCTION increment_review_likes(review_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET likes_count = likes_count + 1 WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_review_likes(review_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_review_comments(review_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET comments_count = comments_count + 1 WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_review_comments(review_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== STEP 4: Ensure RLS policies exist for reviews ==========
-- Drop old policies if they exist (from posts table)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create their own posts" ON reviews;
DROP POLICY IF EXISTS "Users can update their own posts" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own posts" ON reviews;

-- Create/ensure policies exist for reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
CREATE POLICY "Users can create their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);
