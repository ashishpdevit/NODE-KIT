# 📁 Media Library - Final Clean Workflow

## ✅ Perfect Two-Step Process

### Step 1: Upload File
Uploads to storage (local/S3/Azure) - **NO database entry yet**

### Step 2: Attach to Model  
Creates database entry and links to model

---

## 🚀 Workflow

### 1. Upload File (Storage Only)

```bash
curl -X POST http://localhost:3000/api/admin/media/single \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@image.jpg" \
  -F "collectionName=products"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully. Use /attach endpoint to link to a model.",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "image_1697234567_abc.jpg",
    "name": "image",
    "url": "http://localhost:3000/products/image_1697234567_abc.jpg",
    "path": "products/image_1697234567_abc.jpg",
    "mimeType": "image/jpeg",
    "size": "524288",
    "disk": "local",
    "customProperties": {}
  }
}
```

**✅ File is uploaded to storage**  
**❌ NO database entry yet**

---

### 2. Attach to Model (Create DB Entry)

```bash
curl -X POST http://localhost:3000/api/admin/media/attach \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "image_1697234567_abc.jpg",
    "name": "image",
    "mimeType": "image/jpeg",
    "size": 524288,
    "disk": "local",
    "path": "products/image_1697234567_abc.jpg",
    "url": "http://localhost:3000/products/image_1697234567_abc.jpg",
    "modelType": "product",
    "modelId": 123,
    "collectionName": "images"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Media attached to model successfully",
  "data": {
    "id": "1",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "image_1697234567_abc.jpg",
    "url": "http://localhost:3000/products/image_1697234567_abc.jpg",
    "modelType": "product",
    "modelId": "123",
    "collectionName": "images",
    "orderColumn": 1,
    ...
  }
}
```

**✅ Database entry created**  
**✅ Media linked to product #123**

---

## 💡 Complete Example

```javascript
// Step 1: Upload image
const formData = new FormData();
formData.append('file', imageFile);
formData.append('collectionName', 'products');

const uploadRes = await fetch('/api/admin/media/single', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { data: fileInfo } = await uploadRes.json();
console.log('File uploaded:', fileInfo.url);

// Step 2: Create product
const productRes = await fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Blue Widget',
    price: 99.99,
    sku: 'WIDGET-001'
  })
});

const { data: product } = await productRes.json();

// Step 3: Attach uploaded file to product
await fetch('/api/admin/media/attach', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ...fileInfo,                    // All file info from upload
    modelType: 'product',
    modelId: product.id,
    collectionName: 'images'
  })
});

// Done! Media is now in database and linked to product
```

---

## 📡 API Endpoints

### Upload (No DB)
```
POST /api/admin/media/single
Body: file (form-data), collectionName (optional)

Response: { fileName, url, uuid, ... }
```

### Attach (Create DB Entry)
```
POST /api/admin/media/attach
Body: {
  ...uploadResponse,      // All fields from upload
  modelType,              // "product", "user", etc.
  modelId,                // 123
  collectionName          // "images"
}

Creates database entry
```

### Attach Multiple
```
POST /api/admin/media/attach-multiple
Body: {
  files: [...uploadResponses],
  modelType,
  modelId,
  collectionName
}
```

### Detach (Remove from DB)
```
POST /api/admin/media/:id/detach

Removes from database, file stays in storage
```

---

## 🎯 Benefits

✅ **Clean Separation**
- Upload = Storage only
- Attach = Database entry

✅ **No Orphaned Records**
- Database only has attached media
- No unused entries for files never attached

✅ **Flexible**
- Upload first, attach later
- Reattach same file to different models

✅ **Simple Upload**
- Just file + collection
- No model info needed initially

---

## 📝 Testing in Postman

### 1. Upload File
Run: **Admin > Media Library > Upload Single Media**
- Select file
- Set collectionName (optional)
- Send
- **Copy entire `data` object from response**

### 2. Attach to Product
Run: **Admin > Media Library > Attach Media to Model**
- **Paste the file info** from step 1 into body
- Update `modelType` to "product"
- Update `modelId` to your product ID
- Send

**Done!** Media is now in database and linked to product.

---

## 🎉 Key Points

1. **Upload** - Returns file info (fileName, url, uuid, etc.)
2. **Attach** - Send file info + model details
3. **Database** - Only stores attached media
4. **Storage** - All files remain in storage
5. **Detach** - Removes from DB, keeps file in storage

---

**Perfect workflow! Clean and efficient!** 🚀

