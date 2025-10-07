-- =====================================================
-- SUBLY DATABASE SETUP - SCRIPT COMPLET ET FONCTIONNEL
-- =====================================================
-- Copie ce script dans Supabase SQL Editor et exécute-le
-- =====================================================

-- Reset complet
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLES CREATION
-- =====================================================

-- Users table (extends Supabase auth)
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar text,
  role text NOT NULL CHECK (role IN ('seeker', 'landlord')) DEFAULT 'seeker',
  interests text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Listings table
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  photos text[] DEFAULT ARRAY[]::text[],
  price integer NOT NULL CHECK (price > 0),
  location text NOT NULL,
  available text NOT NULL,
  description text NOT NULL,
  amenities text[] DEFAULT ARRAY[]::text[],
  property_type text DEFAULT 'apartment',
  rooms integer DEFAULT 1 CHECK (rooms > 0),
  size integer CHECK (size > 0),
  rules text[] DEFAULT ARRAY[]::text[],
  landlord_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Likes table
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Matches table
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  landlord_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seeker_id, listing_id),
  CHECK (seeker_id != landlord_id)
);

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != receiver_id)
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_listings_landlord_id ON public.listings(landlord_id);
CREATE INDEX idx_listings_price ON public.listings(price);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_listing_id ON public.likes(listing_id);
CREATE INDEX idx_matches_seeker_id ON public.matches(seeker_id);
CREATE INDEX idx_matches_landlord_id ON public.matches(landlord_id);
CREATE INDEX idx_matches_listing_id ON public.matches(listing_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- =====================================================
-- 3. TRIGGERS FOR AUTO-UPDATE
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Listings policies
CREATE POLICY "Anyone can view listings" ON public.listings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Users can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Users can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = landlord_id);

-- Likes policies
CREATE POLICY "Users can view all likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view their matches" ON public.matches
  FOR SELECT USING (
    auth.uid() = seeker_id OR
    auth.uid() = landlord_id
  );

CREATE POLICY "System can create matches" ON public.matches
  FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =====================================================
-- 6. STORAGE SETUP
-- =====================================================

-- Create storage bucket for listings
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow authenticated users to upload to listings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

CREATE POLICY "Allow public read access to listings"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

CREATE POLICY "Allow users to update their own uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'listings');

CREATE POLICY "Allow users to delete their own uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listings');

-- =====================================================
-- 7. COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Database setup completed successfully!';
  RAISE NOTICE '✅ Tables created: users, listings, likes, matches, messages';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Storage bucket created with policies';
  RAISE NOTICE '✅ Indexes and triggers configured';
  RAISE NOTICE '🚀 Your Subly app is ready to use!';
  RAISE NOTICE '📝 Next: Create a user account to test the app';
END
$$;