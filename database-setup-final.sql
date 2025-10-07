-- =====================================================
-- SUBLY DATABASE SETUP - Version Production
-- =====================================================
-- Copie ce script complet dans Supabase SQL Editor
-- et execute-le en une seule fois
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLES CREATION
-- =====================================================

-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar text,
  role text NOT NULL CHECK (role IN ('seeker', 'landlord')) DEFAULT 'seeker',
  interests text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
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
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  landlord_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seeker_id, listing_id),
  CHECK (seeker_id != landlord_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_listings_landlord_id ON public.listings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_listing_id ON public.likes(listing_id);
CREATE INDEX IF NOT EXISTS idx_matches_seeker_id ON public.matches(seeker_id);
CREATE INDEX IF NOT EXISTS idx_matches_landlord_id ON public.matches(landlord_id);
CREATE INDEX IF NOT EXISTS idx_matches_listing_id ON public.matches(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

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

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER listings_updated_at
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
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Listings policies
DROP POLICY IF EXISTS "Anyone can view listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated users can insert listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;

CREATE POLICY "Anyone can view listings" ON public.listings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Users can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Users can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = landlord_id);

-- Likes policies
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

CREATE POLICY "Users can view all likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Matches policies
DROP POLICY IF EXISTS "Users can view their matches" ON public.matches;
DROP POLICY IF EXISTS "System can create matches" ON public.matches;

CREATE POLICY "Users can view their matches" ON public.matches
  FOR SELECT USING (
    auth.uid() = seeker_id OR
    auth.uid() = landlord_id
  );

CREATE POLICY "System can create matches" ON public.matches
  FOR INSERT WITH CHECK (true);

-- Messages policies
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =====================================================
-- 6. DEMO DATA
-- =====================================================

-- Insert demo users (will fail gracefully if they exist)
INSERT INTO public.users (id, email, name, role, interests)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'alice@student.com', 'Alice Martin', 'seeker', ARRAY['non-fumeur', 'calme', 'étudiant']),
  ('550e8400-e29b-41d4-a716-446655440001', 'bob@student.com', 'Bob Dupont', 'landlord', ARRAY['animal ok', 'soirées ok']),
  ('550e8400-e29b-41d4-a716-446655440002', 'claire@student.com', 'Claire Rousseau', 'seeker', ARRAY['vegan', 'sport', 'musique'])
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  interests = EXCLUDED.interests;

-- Insert demo listings
INSERT INTO public.listings (id, title, photos, price, location, available, description, amenities, property_type, rooms, landlord_id)
VALUES
  (
    '660e8400-e29b-41d4-a716-446655440000',
    'Studio cosy centre-ville',
    ARRAY['https://picsum.photos/400/300?random=10', 'https://picsum.photos/400/300?random=11'],
    550,
    'Quartier Latin',
    'Immédiatement',
    'Studio lumineux de 25m² en plein centre-ville, proche des transports.',
    ARRAY['WiFi', 'Cuisine équipée', 'Douche'],
    'studio',
    1,
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Chambre dans coloc sympa',
    ARRAY['https://picsum.photos/400/300?random=20', 'https://picsum.photos/400/300?random=21'],
    400,
    'Belleville',
    'Mars 2024',
    'Chambre dans un T4 avec 3 colocataires étudiants super sympas !',
    ARRAY['Balcon', 'Lave-vaisselle', 'Salon commun'],
    'colocation',
    1,
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'T2 avec terrasse',
    ARRAY['https://picsum.photos/400/300?random=30', 'https://picsum.photos/400/300?random=31'],
    750,
    'Montmartre',
    'Avril 2024',
    'Magnifique T2 avec terrasse, vue sur Paris, parfait pour couple étudiant.',
    ARRAY['Terrasse', 'Parking', 'Cave'],
    'apartment',
    2,
    '550e8400-e29b-41d4-a716-446655440001'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  photos = EXCLUDED.photos,
  price = EXCLUDED.price,
  location = EXCLUDED.location,
  available = EXCLUDED.available,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  property_type = EXCLUDED.property_type,
  rooms = EXCLUDED.rooms;

-- =====================================================
-- 7. COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Database setup completed successfully!';
  RAISE NOTICE '✅ Tables created: users, listings, likes, matches, messages';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Demo data inserted';
  RAISE NOTICE '🚀 Your Subly app is ready to use!';
END
$$;