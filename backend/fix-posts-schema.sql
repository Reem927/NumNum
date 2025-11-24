-- Migration script to fix posts table schema
-- Run this in Supabase SQL Editor

-- First, check if user_id column exists, if not add it
-- If the table has a different column name (like userId), we'll handle that

DO $$
BEGIN
  -- Check if user_id column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'user_id'
  ) THEN
    -- Check if userId (camelCase) exists instead
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'posts' 
      AND column_name = 'userId'
    ) THEN
      -- Rename userId to user_id
      ALTER TABLE posts RENAME COLUMN "userId" TO user_id;
    ELSE
      -- Add user_id column if it doesn't exist at all
      ALTER TABLE posts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      
      -- If there's existing data, you'll need to populate it manually
      -- For now, we'll just add the column
    END IF;
  END IF;
END $$;

-- Ensure all required columns exist
DO $$
BEGIN
  -- Add type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'type'
  ) THEN
    ALTER TABLE posts ADD COLUMN type TEXT;
  END IF;
  
  -- Add content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'content'
  ) THEN
    ALTER TABLE posts ADD COLUMN content TEXT;
  END IF;
  
  -- Add restaurant_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'restaurant_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL;
  END IF;
  
  -- Add rating column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'rating'
  ) THEN
    ALTER TABLE posts ADD COLUMN rating NUMERIC(3, 2);
  END IF;
  
  -- Add image_urls column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE posts ADD COLUMN image_urls TEXT[] DEFAULT '{}';
  END IF;
  
  -- Add likes_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add comments_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN updated_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add type constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'posts' 
    AND constraint_name = 'posts_type_check'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_type_check CHECK (type IN ('review', 'thread'));
  END IF;
  
  -- Add rating constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'posts' 
    AND constraint_name = 'posts_rating_check'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_rating_check CHECK (rating >= 0 AND rating <= 5);
  END IF;
  
  -- Make user_id NOT NULL if it's nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- Only make it NOT NULL if there are no NULL values
    UPDATE posts SET user_id = auth.uid() WHERE user_id IS NULL;
    ALTER TABLE posts ALTER COLUMN user_id SET NOT NULL;
  END IF;
  
  -- Make type NOT NULL if it's nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'type' 
    AND is_nullable = 'YES'
  ) THEN
    UPDATE posts SET type = 'thread' WHERE type IS NULL;
    ALTER TABLE posts ALTER COLUMN type SET NOT NULL;
  END IF;
  
  -- Make content NOT NULL if it's nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'content' 
    AND is_nullable = 'YES'
  ) THEN
    UPDATE posts SET content = '' WHERE content IS NULL;
    ALTER TABLE posts ALTER COLUMN content SET NOT NULL;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_restaurant_id ON posts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Enable RLS if not already enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Create RLS policies
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

