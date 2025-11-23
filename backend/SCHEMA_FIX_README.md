# Database Schema Fix Instructions

## Problem
The error "column posts.user_id does not exist" indicates that the `posts` table (and possibly other tables) don't have the correct schema structure.

## Solution

### Option 1: Run the Migration Script in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration Script**
   - Open the file `fix-all-schema.sql` in this directory
   - Copy the entire contents
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify the Fix**
   - The script will automatically:
     - Add missing `user_id` columns to `posts`, `comments`, and `likes` tables
     - Add all other required columns
     - Create indexes
     - Set up Row Level Security (RLS) policies
     - Create RPC functions for incrementing/decrementing counts

### Option 2: Run Individual Fix Script

If you only want to fix the `posts` table, you can run `fix-posts-schema.sql` instead.

## What the Script Does

The migration script will:

1. **Check for `user_id` column**:
   - If it doesn't exist, it will add it
   - If a column named `userId` (camelCase) exists, it will rename it to `user_id`
   - Sets up the foreign key relationship to `auth.users(id)`

2. **Add missing columns**:
   - `type` (TEXT) - 'review' or 'thread'
   - `content` (TEXT) - post content
   - `restaurant_id` (UUID) - optional reference to restaurant
   - `rating` (NUMERIC) - rating for reviews
   - `image_urls` (TEXT[]) - array of image URLs
   - `likes_count` (INTEGER) - count of likes
   - `comments_count` (INTEGER) - count of comments
   - `created_at` (TIMESTAMPTZ) - creation timestamp
   - `updated_at` (TIMESTAMPTZ) - update timestamp

3. **Add constraints**:
   - Type must be 'review' or 'thread'
   - Rating must be between 0 and 5
   - Required fields are set to NOT NULL

4. **Create indexes** for better query performance

5. **Set up Row Level Security (RLS)** policies:
   - Everyone can view posts
   - Users can only create/update/delete their own posts

6. **Create RPC functions** for managing like and comment counts

## After Running the Script

1. **Test the fix**:
   - Try creating a post from the Community page
   - The error should be resolved

2. **If you still get errors**:
   - Check the Supabase logs in the Dashboard
   - Verify that all columns were created successfully
   - Check the Table Editor to see the actual table structure

## Verification

To verify the schema is correct, you can run this query in Supabase SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;
```

This will show you all columns in the `posts` table and their types.

