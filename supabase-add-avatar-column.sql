-- Add avatar_url column to Supabase profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Optional: ensure full_name column exists if you want display names
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name text;
