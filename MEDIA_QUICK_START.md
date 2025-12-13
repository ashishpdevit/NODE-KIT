# 📁 Media Library - Quick Start Guide

## 🚀 Setup (3 Steps)

### Step 1: Configure Environment

Add to `.env`:

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf
```

### Step 2: Run Migration

```bash
npm run prisma:migrate
```

Migration name: `add_media_library`

### Step 3: Start Server

```bash
npm run dev
```

✅ **Done!** Media library is ready.

---

## 🧪 Test Upload

### Using cURL:

```bash
curl -X POST http://localhost:3000/api/admin/media/single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "modelType=product" \
  -F "modelId=123" \
  -F "collectionName=images"
```

### Using JavaScript:

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('modelType', 'product');
formData.append('modelId', '123');
formData.append('collectionName', 'images');

const response = await fetch('/api/admin/media/single', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const result = await response.json();
console.log('Uploaded:', result.data);
```

---

## 📡 Common Endpoints

```
POST   /api/admin/media/single                    Upload file
POST   /api/admin/media/multiple                  Upload multiple
GET    /api/admin/media/model/:type/:id           Get media by model
DELETE /api/admin/media/:id                       Delete media
PATCH  /api/admin/media/:id/custom-properties     Update metadata
POST   /api/admin/media/reorder/:type/:id/:collection   Reorder
```

---

## 💡 Examples

### Product Gallery

```javascript
// Upload
const formData = new FormData();
files.forEach(f => formData.append('files', f));
formData.append('modelType', 'product');
formData.append('modelId', productId);
formData.append('collectionName', 'gallery');

await fetch('/api/admin/media/multiple', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// Get
const res = await fetch(
  `/api/admin/media/model/product/${productId}?collectionName=gallery`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
const { data } = await res.json();
```

### User Avatar

```javascript
const formData = new FormData();
formData.append('file', avatar);
formData.append('modelType', 'user');
formData.append('modelId', userId);
formData.append('collectionName', 'avatar');

await fetch('/api/app/media/single', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

## 📚 Collections

Organize media by type:

- **`images`** - General images
- **`gallery`** - Image galleries  
- **`avatar`** - Profile pictures
- **`documents`** - PDFs, docs
- **`attachments`** - File attachments
- **Custom** - Any name!

---

## 🔄 Switch to Cloud Storage

### AWS S3:

```env
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=my-bucket
AWS_S3_ACCESS_KEY_ID=...
AWS_S3_SECRET_ACCESS_KEY=...
```

### Azure:

```env
STORAGE_PROVIDER=azure
AZURE_STORAGE_ACCOUNT_NAME=...
AZURE_STORAGE_ACCOUNT_KEY=...
AZURE_STORAGE_CONTAINER=media
```

Restart server. **Done!**

---

## 📖 Full Documentation

See [MEDIA_LIBRARY_SYSTEM.md](./MEDIA_LIBRARY_SYSTEM.md) for complete documentation.

---

**Happy coding! 🎉**

