# 🗄️ Configuration Supabase Storage pour les Images

## 1. 📂 Créer le Bucket

1. Va dans ton **dashboard Supabase**
2. Menu **Storage** → **Buckets**
3. Clique **"New bucket"**
4. Nom du bucket : `listings`
5. **Public bucket** : ✅ COCHÉ (important!)
6. Clique **"Create bucket"**

## 2. 🔐 Configuration des Policies (Permissions)

Va dans **Storage** → **Policies** et ajoute ces 2 policies :

### Policy 1: Allow authenticated upload
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');
```

### Policy 2: Allow public read
```sql
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');
```

## 3. ✅ Test de Configuration

Une fois configuré, teste la création d'annonce :
1. Va sur `/create-listing`
2. Upload des images
3. Remplis le formulaire
4. Clique "Créer l'annonce"

## 4. 🔧 En cas d'erreur

Si tu as des erreurs d'upload :
1. **Vérifie** que le bucket `listings` existe
2. **Vérifie** qu'il est **public**
3. **Vérifie** les policies ci-dessus
4. **Check** les logs dans l'onglet **Storage** → **Logs**

## 5. 📱 Structure des URLs

Les images seront stockées comme :
```
https://[SUPABASE_URL]/storage/v1/object/public/listings/1640995200000_abc123.jpg
```

Et sauvées dans la DB comme :
```json
{
  "photos": [
    "https://[SUPABASE_URL]/storage/v1/object/public/listings/1640995200000_abc123.jpg",
    "https://[SUPABASE_URL]/storage/v1/object/public/listings/1640995200000_def456.jpg"
  ]
}
```