-- Add attached_review_id column to threads table
-- Run this in Supabase SQL Editor

ALTER TABLE threads ADD COLUMN IF NOT EXISTS attached_review_id UUID REFERENCES posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_threads_attached_review_id ON threads(attached_review_id);



