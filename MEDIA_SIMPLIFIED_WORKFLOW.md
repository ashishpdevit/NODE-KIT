# 📁 Media Library - Simplified Workflow

## ✅ Two-Step Process

### Step 1: Upload (Simple)
Just upload the file - no model required!

### Step 2: Attach (Later)
Attach the uploaded media to a model when needed.

---

## 🚀 Upload - Super Simple

### Only 2 Fields Required!

```bash
curl -X POST http://localhost:3000/api/admin/media/single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "file=@image.jpg" \
  -F "collectionName=images"
```

**That's it!** Just `file` + `collectionName` (optional, defaults to "default")

### In Postman:
- `file` → Select your file
- `collectionName` → "images" (optional)

**No modelType, no modelId needed!**

---

## 🔗 Attach to Model Later

After upload, you get a media ID. Then attach it:

```bash
curl -X POST http://localhost:3000/api/admin/media/5/attach \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelType": "product",
    "modelId": 123,
    "collectionName": "images"
  }'
```

### In JavaScript:

```javascript
// Step 1: Upload file
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('collectionName', 'images');

const uploadRes = await fetch('/api/admin/media/single', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { data: media } = await uploadRes.json();
console.log('Uploaded:', media.id);

// Step 2: Attach to product (later, when you have product ID)
await fetch(`/api/admin/media/${media.id}/attach`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    modelType: 'product',
    modelId: 123,
    collectionName: 'images'
  })
});
```

---

## 📋 Complete Workflow Examples

### Example 1: Product Creation

```javascript
// 1. User uploads 3 images
const images = [img1, img2, img3];
const uploadedMedia = [];

for (const img of images) {
  const formData = new FormData();
  formData.append('file', img);
  formData.append('collectionName', 'products');
  
  const res = await fetch('/api/admin/media/single', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const { data } = await res.json();
  uploadedMedia.push(data.id);
}

// 2. User creates product
const productRes = await fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Blue Widget',
    price: 99.99,
    sku: 'WIDGET-001',
    ...
  })
});

const { data: product } = await productRes.json();

// 3. Attach uploaded images to product
await fetch('/api/admin/media/attach-multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ids: uploadedMedia,
    modelType: 'product',
    modelId: product.id,
    collectionName: 'gallery'
  })
});
```

### Example 2: User Avatar

```javascript
// 1. Upload avatar
const formData = new FormData();
formData.append('file', avatarFile);
formData.append('collectionName', 'avatars');

const uploadRes = await fetch('/api/app/media/single', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { data: media } = await uploadRes.json();

// 2. Attach to user profile
await fetch(`/api/app/media/${media.id}/attach`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    modelType: 'user',
    modelId: userId,
    collectionName: 'avatar'
  })
});
```

---

## 📡 New API Endpoints

### Upload (Simplified)
```
POST /api/admin/media/single
POST /api/admin/media/multiple

Body (form-data):
  - file or files (required)
  - collectionName (optional, default: "default")
```

### Attach/Detach
```
POST /api/admin/media/:id/attach
Body: { modelType, modelId, collectionName }

POST /api/admin/media/attach-multiple
Body: { ids: [1,2,3], modelType, modelId, collectionName }

POST /api/admin/media/:id/detach
(No body needed - makes media unattached)
```

### Get Unattached
```
GET /api/admin/media/unattached?page=1&limit=20&collectionName=images
```

---

## 🎯 Benefits

✅ **Simpler Upload** - Just file + collection, that's it!  
✅ **Flexible Workflow** - Upload first, attach later  
✅ **Reusable Media** - One media can be detached and reattached  
✅ **Media Library** - View all unattached media  
✅ **Bulk Operations** - Attach multiple media at once  

---

## 📝 API Summary

| Endpoint | Required Fields | Purpose |
|----------|----------------|---------|
| `POST /media/single` | `file`, `collectionName` (opt) | Upload file |
| `POST /media/multiple` | `files`, `collectionName` (opt) | Upload files |
| `POST /media/:id/attach` | `modelType`, `modelId` | Link to model |
| `POST /media/attach-multiple` | `ids[]`, `modelType`, `modelId` | Link multiple |
| `POST /media/:id/detach` | none | Unlink from model |
| `GET /media/unattached` | none | List unlinked media |

---

## ✅ Testing in Postman

### 1. Simple Upload
Run: **Admin > Media Library > Upload Single Media**
- Select file
- Set collectionName (or leave default)
- Send

### 2. Attach to Product
Run: **Admin > Media Library > Attach Media to Model**
- Copy media ID from step 1
- Set in {{mediaId}} variable
- Update productId
- Send

### 3. View Unattached Media
Run: **Admin > Media Library > Get Unattached Media**
- See all media not yet attached to models

---

**Much simpler workflow! 🎉**

