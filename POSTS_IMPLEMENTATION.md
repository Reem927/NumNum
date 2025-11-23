# Posts, Threads, and Replies Implementation

This document describes the implementation of CRUD operations for posts, threads, comments, and likes in the NumNum application.

## Files Created/Modified

### 1. Type Definitions
- **`frontend/types/posts.ts`** - TypeScript interfaces for:
  - `Post` - Main post type (supports both 'review' and 'thread' types)
  - `Comment` - Comment/reply structure with nested replies support
  - `Like` - Like structure for posts and comments
  - `CreatePostData` - Data structure for creating posts
  - `CreateCommentData` - Data structure for creating comments

### 2. API Service
- **`frontend/services/api.ts`** - Added CRUD functions:
  
  **Posts:**
  - `createPost()` - Create a new post (review or thread)
  - `getPosts()` - Fetch posts with filtering options (type, userId, restaurantId, pagination)
  - `getPost()` - Fetch a single post by ID
  - `updatePost()` - Update an existing post (owner only)
  - `deletePost()` - Delete a post (owner only)

  **Comments:**
  - `createComment()` - Create a comment or reply (nested replies supported via parent_id)
  - `getComments()` - Fetch all comments for a post (includes nested replies)
  - `updateComment()` - Update a comment (owner only)
  - `deleteComment()` - Delete a comment (owner only)

  **Likes:**
  - `toggleLikePost()` - Like/unlike a post
  - `isPostLiked()` - Check if current user has liked a post

### 3. Context Provider
- **`frontend/context/PostContext.tsx`** - React context for managing posts state:
  - Posts list management
  - Loading and error states
  - CRUD operations wrapper functions
  - Like/unlike functionality
  - Comment management
  - Auto-refresh posts on mount

### 4. Database Schema
- **`backend/supabase-schema.sql`** - SQL schema for Supabase including:
  - `posts` table with support for reviews and threads
  - `comments` table with nested replies support
  - `likes` table for posts and comments
  - RPC functions for incrementing/decrementing counts
  - Row Level Security (RLS) policies

## Database Setup

### Step 1: Run the SQL Schema
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `backend/supabase-schema.sql`
4. Run the SQL to create tables, functions, and policies

### Step 2: Verify Tables Created
The following tables should be created:
- `posts`
- `comments`
- `likes`
- `profiles` (if it doesn't exist already)

### Step 3: Verify RPC Functions
These functions should be created:
- `increment_post_likes(post_id uuid)`
- `decrement_post_likes(post_id uuid)`
- `increment_post_comments(post_id uuid)`
- `decrement_post_comments(post_id uuid)`

## Usage

### 1. Wrap your app with PostProvider
In your main layout file (`frontend/app/_layout.tsx`), wrap the app with `PostProvider`:

```tsx
import { PostProvider } from '@/context/PostContext';

// In your root layout:
<PostProvider>
  {/* Your app content */}
</PostProvider>
```

### 2. Use the PostContext in components
```tsx
import { usePosts } from '@/context/PostContext';

function MyComponent() {
  const { posts, loading, createPost, toggleLike, getComments } = usePosts();
  
  // Create a post
  const handleCreate = async () => {
    const newPost = await createPost({
      type: 'thread',
      content: 'My post content',
    });
  };
  
  // Like a post
  const handleLike = async (postId: string) => {
    await toggleLike(postId);
  };
  
  // Get comments
  const comments = await getComments(postId);
}
```

## Features

### Post Types
- **Review Posts** (`type: 'review'`):
  - Must include `restaurant_id`
  - Can include `rating` (0-5)
  - Can include `image_urls` array

- **Thread Posts** (`type: 'thread'`):
  - Text-based discussion posts
  - No restaurant association required

### Comments/Replies
- Top-level comments on posts
- Nested replies to comments (via `parent_id`)
- All comments automatically fetch their replies when retrieved

### Likes
- Users can like/unlike posts
- Like count automatically tracked
- Duplicate likes prevented by database constraints

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only modify their own posts/comments
- Users can only delete their own likes
- All data is readable by authenticated users

## Next Steps

1. **Update Community Screen** - Connect `Community.tsx` to use real posts from `usePosts()`
2. **Update Create Screen** - Connect `Create.tsx` to use `createPost()` function
3. **Add Post Detail Screen** - Create a screen to view full post with comments
4. **Add Comment UI** - Build UI components for displaying and creating comments
5. **Add Image Upload** - Implement image upload functionality for review posts

## Notes

- The API service includes fallback logic if RPC functions don't exist in the database
- All count updates (likes_count, comments_count) are handled automatically
- The PostContext automatically refreshes posts on mount
- Error handling is built into all API functions

