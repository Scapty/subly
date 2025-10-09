-- ===========================
-- NOUVELLE STRUCTURE DATABASE
-- Refonte complète pour matching logement
-- ===========================

-- Table utilisateurs (simplifiée + profil enrichi)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  description TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('homme', 'femme', 'autre', 'non-précisé')),

  -- Profil de compatibilité
  hobbies TEXT[] DEFAULT '{}', -- sport, musique, lecture, nature, cuisine, voyage, etc.
  lifestyle JSONB DEFAULT '{}', -- Structure détaillée ci-dessous

  -- Préférences de cohabitation
  preferred_roommate_count INTEGER, -- nombre de colocataires souhaités
  preferred_age_min INTEGER,
  preferred_age_max INTEGER,
  preferred_gender TEXT, -- préférence genre colocataires

  -- Status du profil
  profile_completed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Structure lifestyle (JSON) :
-- {
--   "social_level": 1-5, // 1: calme, 5: très social
--   "cleanliness": 1-5, // 1: bordélique, 5: maniaque
--   "noise_sensitivity": 1-5, // 1: pas sensible, 5: très sensible
--   "sleep_schedule": "early" | "normal" | "late" | "flexible",
--   "weekend_activity": "sortir" | "maison" | "flexible",
--   "guest_frequency": "jamais" | "rarement" | "souvent" | "flexible",
--   "cohabitation_style": "amis" | "indépendants" | "familial"
-- }

-- Table annonces logement (enrichie)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Infos basiques
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',

  -- Localisation & prix
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL, -- quartier sélectionnable
  rent_amount INTEGER NOT NULL, -- loyer en euros
  charges_included BOOLEAN DEFAULT FALSE,

  -- Disponibilité
  available_from DATE NOT NULL,
  minimum_duration_months INTEGER DEFAULT 1,

  -- Caractéristiques logement
  property_type TEXT NOT NULL, -- appartement, maison, studio, etc.
  total_rooms INTEGER,
  available_rooms INTEGER, -- chambres disponibles
  apartment_size INTEGER, -- m²
  furnished BOOLEAN DEFAULT FALSE,

  -- Tags logement
  amenities TEXT[] DEFAULT '{}', -- machine_a_laver, balcon, jardin, parking, etc.
  rules TEXT[] DEFAULT '{}', -- non_fumeur, animaux_ok, calme_requis, etc.

  -- Colocataires actuels
  current_roommate_count INTEGER DEFAULT 0,
  current_roommate_ages INTEGER[] DEFAULT '{}',
  roommate_lifestyle JSONB DEFAULT '{}', -- même structure que users.lifestyle

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table likes (qui like quoi)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID REFERENCES users(id) ON DELETE CASCADE, -- qui aime
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE, -- l'annonce

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unique : un user ne peut liker qu'une fois la même annonce
  UNIQUE(liker_id, listing_id)
);

-- Table matches (quand ça matche)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID REFERENCES users(id) ON DELETE CASCADE, -- celui qui cherche
  landlord_id UUID REFERENCES users(id) ON DELETE CASCADE, -- celui qui loue
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE, -- l'annonce

  -- Score de compatibilité (calculé)
  compatibility_score FLOAT,

  -- Status du match
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),

  -- Timestamps
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unique : un seul match par trio seeker/landlord/listing
  UNIQUE(seeker_id, landlord_id, listing_id)
);

-- Table messages (chat entre utilisateurs)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- INDEX pour optimiser les performances
-- ===========================

-- Index pour les recherches
CREATE INDEX idx_users_profile_completed ON users(profile_completed);
CREATE INDEX idx_listings_active ON listings(is_active);
CREATE INDEX idx_listings_neighborhood ON listings(neighborhood);
CREATE INDEX idx_listings_rent ON listings(rent_amount);
CREATE INDEX idx_listings_available_from ON listings(available_from);

-- Index pour le matching
CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_listing_id ON likes(listing_id);
CREATE INDEX idx_matches_seeker_id ON matches(seeker_id);
CREATE INDEX idx_matches_landlord_id ON matches(landlord_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Index pour les messages
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ===========================
-- TRIGGERS pour updated_at
-- ===========================

-- Fonction pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===========================
-- RLS (Row Level Security) pour Supabase
-- ===========================

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques basiques (à affiner selon besoins)
-- Users : peuvent voir leur propre profil + profils publics
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Listings : visibles par tous, modifiables par le propriétaire
CREATE POLICY "Listings are viewable by everyone" ON listings FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own listings" ON listings FOR ALL USING (auth.uid() = landlord_id);

-- Likes : visibles et créables par l'utilisateur
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid() = liker_id);

-- Matches : visibles par les participants
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = landlord_id);

-- Messages : visibles par les participants du match
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT seeker_id FROM matches WHERE id = match_id
      UNION
      SELECT landlord_id FROM matches WHERE id = match_id
    )
  );

CREATE POLICY "Users can send messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT seeker_id FROM matches WHERE id = match_id
      UNION
      SELECT landlord_id FROM matches WHERE id = match_id
    )
  );