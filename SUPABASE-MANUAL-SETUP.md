# 🛠️ Configuration Manuelle Supabase - Étape par Étape

Le SQL Editor semble avoir des problèmes d'interface. Voici comment créer les tables manuellement.

## 📋 Étapes à Suivre

### 1. 🔐 Activer RLS d'abord

Va dans **SQL Editor** et copie SEULEMENT cette commande (une par une) :

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Puis :

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
```

### 2. 👥 Créer la table Users

Va dans **Table Editor** → **Create a new table**

**Nom de la table :** `users`

**Colonnes à ajouter :**
- `id` (uuid, Primary Key, Default: `auth.uid()`)
- `email` (text, Unique, Not Null)
- `name` (text, Not Null)
- `avatar` (text, Nullable)
- `role` (text, Not Null, Default: 'seeker')
- `interests` (text[], Default: '{}')
- `created_at` (timestamptz, Default: `now()`)
- `updated_at` (timestamptz, Default: `now()`)

**Contraintes :**
- Role CHECK: `role IN ('seeker', 'landlord')`

### 3. 🏠 Créer la table Listings

**Nom de la table :** `listings`

**Colonnes :**
- `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
- `title` (text, Not Null)
- `photos` (text[], Default: '{}')
- `price` (integer, Not Null, CHECK: `price > 0`)
- `location` (text, Not Null)
- `available` (text, Not Null)
- `description` (text, Not Null)
- `amenities` (text[], Default: '{}')
- `property_type` (text, Default: 'apartment')
- `rooms` (integer, Default: 1, CHECK: `rooms > 0`)
- `size` (integer, Nullable, CHECK: `size > 0`)
- `rules` (text[], Default: '{}')
- `landlord_id` (uuid, Foreign Key vers users(id), Not Null)
- `created_at` (timestamptz, Default: `now()`)
- `updated_at` (timestamptz, Default: `now()`)

### 4. ❤️ Créer la table Likes

**Nom de la table :** `likes`

**Colonnes :**
- `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
- `user_id` (uuid, Foreign Key vers users(id), Not Null)
- `listing_id` (uuid, Foreign Key vers listings(id), Not Null)
- `created_at` (timestamptz, Default: `now()`)

**Contraintes :**
- UNIQUE(user_id, listing_id)

### 5. 🤝 Créer la table Matches

**Nom de la table :** `matches`

**Colonnes :**
- `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
- `seeker_id` (uuid, Foreign Key vers users(id), Not Null)
- `landlord_id` (uuid, Foreign Key vers users(id), Not Null)
- `listing_id` (uuid, Foreign Key vers listings(id), Not Null)
- `created_at` (timestamptz, Default: `now()`)

**Contraintes :**
- UNIQUE(seeker_id, listing_id)
- CHECK(seeker_id != landlord_id)

### 6. 💬 Créer la table Messages

**Nom de la table :** `messages`

**Colonnes :**
- `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
- `sender_id` (uuid, Foreign Key vers users(id), Not Null)
- `receiver_id` (uuid, Foreign Key vers users(id), Not Null)
- `content` (text, Not Null)
- `created_at` (timestamptz, Default: `now()`)

**Contraintes :**
- CHECK(sender_id != receiver_id)

## 🔒 Ajouter les Policies RLS

Une fois toutes les tables créées, va dans **SQL Editor** et ajoute ces policies UNE PAR UNE :

### Users Policies
```sql
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
```

```sql
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
```

```sql
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
```

### Listings Policies
```sql
CREATE POLICY "Anyone can view listings" ON public.listings FOR SELECT USING (true);
```

```sql
CREATE POLICY "Users can insert listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = landlord_id);
```

```sql
CREATE POLICY "Users can update own listings" ON public.listings FOR UPDATE USING (auth.uid() = landlord_id);
```

```sql
CREATE POLICY "Users can delete own listings" ON public.listings FOR DELETE USING (auth.uid() = landlord_id);
```

### Likes Policies
```sql
CREATE POLICY "Users can view likes" ON public.likes FOR SELECT USING (true);
```

```sql
CREATE POLICY "Users can insert own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can delete own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);
```

### Matches Policies
```sql
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = landlord_id);
```

```sql
CREATE POLICY "System can create matches" ON public.matches FOR INSERT WITH CHECK (true);
```

### Messages Policies
```sql
CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
```

```sql
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

## 📊 Ajouter les Triggers (Optionnel)

Pour auto-update les timestamps :

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

```sql
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

```sql
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## ✅ Vérification

Une fois terminé, tu devrais voir 5 tables dans ton dashboard :
- users
- listings
- likes
- matches
- messages

Ensuite, suis le guide `SUPABASE-STORAGE-SETUP.md` pour configurer le stockage des images.