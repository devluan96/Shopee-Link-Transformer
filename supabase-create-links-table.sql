-- Migration: Create links table for Shopee Link Transformer
-- Created: 2026-04-21

-- Enable Row Level Security
ALTER TABLE IF EXISTS links DISABLE ROW LEVEL SECURITY;

-- Drop table if exists (for development/testing)
DROP TABLE IF EXISTS links;

-- Create links table
CREATE TABLE links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    custom_title TEXT,
    custom_description TEXT,
    custom_image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_short_code ON links(short_code);
CREATE INDEX idx_links_created_at ON links(created_at DESC);

-- Enable Row Level Security
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own links
CREATE POLICY "Users can view own links" ON links
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own links
CREATE POLICY "Users can insert own links" ON links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own links
CREATE POLICY "Users can update own links" ON links
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own links
CREATE POLICY "Users can delete own links" ON links
    FOR DELETE USING (auth.uid() = user_id);

-- Admin can see all links (if you have admin role)
CREATE POLICY "Admins can view all links" ON links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language '\''plpgsql'\'';

CREATE TRIGGER update_links_updated_at
    BEFORE UPDATE ON links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON links TO authenticated;
GRANT ALL ON links TO service_role;
