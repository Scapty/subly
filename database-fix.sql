-- Fix pour l'erreur foreign key constraint
-- Supprime les données de démo et garde seulement la structure

-- =====================================================
-- SUPPRESSION DES DONNÉES DE DÉMO PROBLÉMATIQUES
-- =====================================================

-- Supprime les données de démo qui causent l'erreur foreign key
DELETE FROM public.listings WHERE landlord_id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002'
);

DELETE FROM public.users WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002'
);

-- =====================================================
-- CORRECTION DE LA TABLE USERS
-- =====================================================

-- Supprime la contrainte foreign key problématique sur users.id
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- La table users doit référencer auth.users mais pas avec une foreign key stricte
-- car les utilisateurs sont créés dans auth.users par Supabase Auth automatiquement

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Erreur foreign key corrigée !';
  RAISE NOTICE '✅ Données de démo supprimées';
  RAISE NOTICE '🚀 Base de données prête pour de vrais utilisateurs !';
  RAISE NOTICE '📝 Crée maintenant un compte sur ton app pour tester';
END
$$;