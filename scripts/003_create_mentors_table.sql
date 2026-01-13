-- Create mentors table
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Founders', 'Growth & Marketing', 'Professionals')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for search performance
CREATE INDEX IF NOT EXISTS mentors_name_idx ON mentors USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS mentors_brand_idx ON mentors USING GIN (to_tsvector('english', brand_name));
CREATE INDEX IF NOT EXISTS mentors_category_idx ON mentors(category);

-- Enable Row Level Security
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON mentors
  FOR SELECT
  USING (true);
