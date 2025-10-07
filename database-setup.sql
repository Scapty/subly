-- Subly Database Schema Setup
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar text,
  role text NOT NULL CHECK (role IN ('seeker', 'landlord')),
  interests text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  photos text[] DEFAULT '{}',
  price integer NOT NULL,
  location text NOT NULL,
  available text NOT NULL,
  description text NOT NULL,
  amenities text[] DEFAULT '{}',
  property_type text DEFAULT 'apartment',
  rooms integer DEFAULT 1,
  size integer, -- in square meters
  rules text[] DEFAULT '{}',
  landlord_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  landlord_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(seeker_id, listing_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can view all profiles, but only update their own
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings: Public read, landlords can CRUD their own
CREATE POLICY "Anyone can view listings" ON public.listings
  FOR SELECT USING (true);

CREATE POLICY "Landlords can insert listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = landlord_id);

-- Likes: Users can CRUD their own likes
CREATE POLICY "Users can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Matches: Users can view matches they're part of
CREATE POLICY "Users can view their matches" ON public.matches
  FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = landlord_id);

CREATE POLICY "System can create matches" ON public.matches
  FOR INSERT WITH CHECK (true);

-- Messages: Users can view and send messages in their matches
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_landlord_id ON public.listings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_listing_id ON public.likes(listing_id);
CREATE INDEX IF NOT EXISTS idx_matches_seeker_id ON public.matches(seeker_id);
CREATE INDEX IF NOT EXISTS idx_matches_landlord_id ON public.matches(landlord_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some demo data
INSERT INTO public.users (id, email, name, role, interests) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'alice@student.com', 'Alice Martin', 'seeker', ARRAY['non-fumeur', 'calme', 'étudiant']),
  ('550e8400-e29b-41d4-a716-446655440001', 'bob@student.com', 'Bob Dupont', 'landlord', ARRAY['animal ok', 'soirées ok']),
  ('550e8400-e29b-41d4-a716-446655440002', 'claire@student.com', 'Claire Rousseau', 'seeker', ARRAY['vegan', 'sport', 'musique'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.listings (id, title, photos, price, location, available, description, amenities, landlord_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'Studio cosy centre-ville',
   ARRAY['https://picsum.photos/400/300?random=10', 'https://picsum.photos/400/300?random=11'],
   550, 'Quartier Latin', 'Immédiatement',
   'Studio lumineux de 25m² en plein centre-ville, proche des transports.',
   ARRAY['WiFi', 'Cuisine équipée', 'Douche'],
   '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440001', 'Chambre dans coloc sympa',
   ARRAY['https://picsum.photos/400/300?random=20', 'https://picsum.photos/400/300?random=21'],
   400, 'Belleville', 'Mars 2024',
   'Chambre dans un T4 avec 3 colocataires étudiants super sympas !',
   ARRAY['Balcon', 'Lave-vaisselle', 'Salon commun'],
   '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', 'T2 avec terrasse',
   ARRAY['https://picsum.photos/400/300?random=30', 'https://picsum.photos/400/300?random=31'],
   750, 'Montmartre', 'Avril 2024',
   'Magnifique T2 avec terrasse, vue sur Paris, parfait pour couple étudiant.',
   ARRAY['Terrasse', 'Parking', 'Cave'],
   '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;