# Mentors Directory Setup Guide

## Overview
The mentors directory at `/mentors` displays all 63 mentors across 3 categories (Founders, Growth & Marketing, Professionals) with search, filter, and sort functionality.

## Database Setup Instructions

### Step 1: Verify Supabase Connection
Ensure these environment variables are set in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (for setup script)

### Step 2: Run the Setup Script
Execute the mentors database setup:
```bash
npm run setup-mentors
```

This script will:
1. Create the `mentors` table with proper schema
2. Create indexes for search performance
3. Enable Row Level Security (RLS)
4. Seed all 63 mentors into the database

### Step 3: Verify Setup
Check your Supabase dashboard:
1. Go to SQL Editor
2. Run: `SELECT COUNT(*) FROM mentors;`
3. You should see: `count: 63`

## Features

- **Search**: Real-time search across mentor names and companies
- **Filter**: Toggle between 3 categories with live count badges
- **Sort**: A-Z, Z-A, or recently added
- **Responsive**: Mobile-first responsive grid layout
- **Performance**: Full-text search with database indexes

## File Structure

```
app/mentors/page.tsx                      # Main mentors page
components/mentors/
  ├── mentors-directory.tsx               # Main directory component
  ├── mentor-card.tsx                     # Individual mentor card
  ├── mentor-search.tsx                   # Search input component
  └── mentor-filters.tsx                  # Category filters & sort
lib/supabase/mentors.ts                   # Database queries
scripts/setup-mentors-db.mjs              # Setup script
```

## Database Schema

```sql
CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Troubleshooting

**Q: "Tenant or user not found" error**
A: Run `npm run setup-mentors` to properly initialize the database with Supabase client authentication.

**Q: No mentors showing on the page**
A: Check that the mentors table has been seeded. Run the setup script again and verify with:
```bash
SELECT COUNT(*) FROM mentors;
```

**Q: Search not working**
A: Ensure indexes were created properly. Check Supabase dashboard → Tables → mentors → Indexes.

## Next Steps

- Customize mentor cards styling in `components/mentors/mentor-card.tsx`
- Add mentor detail pages with more information
- Integrate mentor booking/contact system
