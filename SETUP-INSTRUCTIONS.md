# 🚀 Subly - Setup Instructions

## 📋 **Étapes pour configurer Subly**

### 1. **📊 Configuration Supabase**

#### a) Créer la base de données
1. Va dans ton projet Supabase
2. Va dans **SQL Editor**
3. Copie-colle le contenu du fichier `database-setup.sql`
4. Execute le script

#### b) Configurer le Storage (pour les images)
1. Va dans **Storage** dans Supabase
2. Crée un nouveau bucket appelé `listings`
3. Configure-le en **public**
4. Ajoute une policy pour permettre les uploads :

```sql
-- Policy pour permettre l'upload d'images
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES ('listings', 'Allow authenticated uploads',
'(auth.role() = ''authenticated'')');

-- Policy pour permettre la lecture publique
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES ('listings', 'Allow public access', 'true');
```

### 2. **🔑 Variables d'environnement**

Les variables Supabase sont déjà configurées dans `.env.local` :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. **🛠️ Installation et lancement**

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev
```

L'app sera disponible sur `http://localhost:3004`

---

## ✨ **Nouvelles fonctionnalités implémentées**

### 🔥 **1. Chat temps réel**
- **Route :** `/chat/[userId]`
- **Fonctionnalités :**
  - Messages en temps réel via Supabase Realtime
  - Interface mobile optimisée
  - Historique des conversations
  - Accès uniquement entre utilisateurs matchés

### 🔍 **2. Recherche manuelle avec filtres**
- **Route :** `/search`
- **Fonctionnalités :**
  - Recherche textuelle
  - Filtres : prix, localisation, type, nombre de pièces
  - Cards type Airbnb
  - Possibilité de liker directement

### 📱 **3. Vue détaillée des logements**
- **Route :** `/listing/[id]`
- **Fonctionnalités :**
  - Carousel d'images
  - Informations complètes
  - Actions swipe (like/pass)
  - Accessible depuis le swipe et la recherche

### 🏠 **4. Création d'annonces pour tous**
- **Route :** `/create-listing`
- **Fonctionnalités :**
  - Upload multiple d'images
  - Formulaire complet
  - Sauvegarde dans Supabase
  - Accessible aux chercheurs ET aux loueurs

---

## 🎯 **Navigation mise à jour**

### **Page d'accueil (/home)**
Nouveaux boutons dans le header :
- 🔍 **Recherche** → `/search`
- ➕ **Créer annonce** → `/create-listing`
- 💬 **Matches** → `/matches`
- 🚪 **Déconnexion**

### **Swipe Cards**
- 👁️ **Bouton "voir détails"** → `/listing/[id]`
- Drag & drop touch optimisé

### **Page Matches (/matches)**
- 💬 **Bouton "Chatter"** → `/chat/[userId]`
- Interface temps réel

---

## 🧪 **Test des fonctionnalités**

### **Flow complet de test :**

1. **Créer des comptes :**
   - Compte chercheur : `alice@student.com` / `password`
   - Compte loueur : `bob@student.com` / `password`

2. **Tester le swipe :**
   - Connecte-toi avec Alice
   - Swipe à droite sur un logement

3. **Tester le matching :**
   - Connecte-toi avec Bob (loueur)
   - Va dans "Likes reçus"
   - Like en retour → Création du match

4. **Tester le chat :**
   - Va dans "Mes Matchs"
   - Clique "Chatter"
   - Envoie des messages en temps réel

5. **Tester la recherche :**
   - Utilise la barre de recherche
   - Teste les filtres
   - Like des logements

6. **Tester la création d'annonce :**
   - Clique sur "+"
   - Upload des images
   - Remplis le formulaire
   - Publie l'annonce

---

## 🎨 **Design & UX**

- **Mobile-first** : Optimisé pour l'utilisation sur téléphone
- **Couleurs vives** : Interface moderne et jeune
- **Animations fluides** : Transitions et micro-interactions
- **Touch-friendly** : Boutons et zones de tap optimisés

---

## 🚀 **Ready for Demo !**

L'application est maintenant **100% fonctionnelle** avec toutes les features demandées :

✅ Chat temps réel
✅ Recherche avec filtres
✅ Vue détaillée des logements
✅ Création d'annonces
✅ Système de matching
✅ Interface mobile parfaite

**Perfect pour une démo lors d'un entretien !** 📱✨