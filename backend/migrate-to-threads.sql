-- Migration Script: Update Comments and Likes to use thread_id instead of post_id
-- Run this in Supabase SQL Editor AFTER verifying your database structure
-- 
-- IMPORTANT: This script assumes you're migrating from a posts-only structure to a threads structure
-- If your database already uses thread_id, you may not need all of these steps

-- ========== STEP 1: Add thread_id columns if they don't exist ==========

-- Add thread_id to comments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN thread_id UUID REFERENCES threads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add thread_id to likes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'likes' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE likes ADD COLUMN thread_id UUID REFERENCES threads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ========== STEP 2: Migrate data from post_id to thread_id (if needed) ==========
-- 
-- WARNING: Only run this if you have existing data in post_id columns that needs to be migrated
-- This assumes that post_id values in comments/likes actually reference threads, not reviews
-- 
-- Uncomment the following lines if you need to migrate existing data:
--
-- UPDATE comments 
-- SET thread_id = post_id 
-- WHERE post_id IS NOT NULL AND thread_id IS NULL;
--
-- UPDATE likes 
-- SET thread_id = post_id 
-- WHERE post_id IS NOT NULL AND thread_id IS NULL;

-- ========== STEP 3: Update constraints and indexes ==========

-- Drop old indexes if they exist
DROP INDEX IF EXISTS idx_comments_post_id;
DROP INDEX IF EXISTS idx_likes_post_id;

-- Create new indexes for thread_id
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_likes_thread_id ON likes(thread_id);

-- ========== STEP 4: Update constraints on likes table ==========

-- Drop old constraints if they exist
DO $$
BEGIN
  -- Drop old unique constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'likes' AND constraint_name = 'unique_post_like'
  ) THEN
    ALTER TABLE likes DROP CONSTRAINT unique_post_like;
  END IF;
  
  -- Drop old check constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'likes' AND constraint_name = 'check_like_target'
  ) THEN
    ALTER TABLE likes DROP CONSTRAINT check_like_target;
  END IF;
END $$;

-- Add new constraints for thread_id
ALTER TABLE likes 
  ADD CONSTRAINT check_like_target CHECK (
    (thread_id IS NOT NULL AND comment_id IS NULL) OR
    (thread_id IS NULL AND comment_id IS NOT NULL)
  );

-- Add unique constraint for thread likes
CREATE UNIQUE INDEX IF NOT EXISTS unique_thread_like ON likes(user_id, thread_id) WHERE thread_id IS NOT NULL;

-- ========== STEP 5: Make thread_id NOT NULL (after data migration) ==========
-- 
-- WARNING: Only run this AFTER you've migrated all data from post_id to thread_id
-- Uncomment when ready:
--
-- ALTER TABLE comments ALTER COLUMN thread_id SET NOT NULL;

-- ========== STEP 6: Drop old post_id columns (after verification) ==========
-- 
-- WARNING: Only run this AFTER verifying that all data has been migrated and thread_id is working
-- Make sure to backup your database before running these!
-- Uncomment when ready:
--
-- ALTER TABLE comments DROP COLUMN IF EXISTS post_id;
-- ALTER TABLE likes DROP COLUMN IF EXISTS post_id;

-- ========== STEP 7: Remove type column from posts table (if it exists) ==========
-- 
-- Since posts are now only for reviews, the type column is no longer needed
-- Uncomment when ready:
--
-- ALTER TABLE posts DROP COLUMN IF EXISTS type;
-- DROP INDEX IF EXISTS idx_posts_type;

-- ========== STEP 8: Ensure threads table exists with correct structure ==========
-- 
-- The threads table should already exist, but verify it has all required columns:
DO $$
BEGIN
  -- Add attached_review_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'threads' AND column_name = 'attached_review_id'
  ) THEN
    ALTER TABLE threads ADD COLUMN attached_review_id UUID REFERENCES posts(id) ON DELETE SET NULL;
  END IF;
  
  -- Add cuisine if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'threads' AND column_name = 'cuisine'
  ) THEN
    ALTER TABLE threads ADD COLUMN cuisine TEXT;
  END IF;
END $$;

-- Create index for attached_review_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_threads_attached_review_id ON threads(attached_review_id);

-- ========== STEP 9: Create/Update RPC Functions for Threads ==========
-- 
-- These should already exist from the schema file, but ensure they're up to date:

CREATE OR REPLACE FUNCTION increment_thread_likes(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE threads SET likes_count = likes_count + 1 WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_thread_likes(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE threads SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_thread_comments(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE threads SET comments_count = comments_count + 1 WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_thread_comments(thread_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE threads SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== STEP 10: Update RLS Policies for Threads ==========
-- 
-- Ensure threads table has RLS enabled and proper policies:

ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Threads are viewable by everyone" ON threads;
DROP POLICY IF EXISTS "Users can create their own threads" ON threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;
DROP POLICY IF EXISTS "Users can delete their own threads" ON threads;

-- Create new policies
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

