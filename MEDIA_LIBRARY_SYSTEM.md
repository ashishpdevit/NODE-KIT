# 📁 Media Library System Documentation

## Overview

A **production-ready media management system** inspired by Laravel Media Library, supporting multiple storage providers (Local, AWS S3, Azure) with polymorphic relationships, collections, and advanced features.

---

## 🌟 Features

✅ **Polymorphic Relations** - Attach media to any model (Products, Users, Orders, etc.)
✅ **Collection Management** - Organize media in collections (images, documents, avatars, etc.)
✅ **Multiple Storage Providers** - Local, AWS S3, Azure (switch with one env variable)
✅ **Order Management** - Sort media within collections
✅ **Custom Properties** - Store additional metadata
✅ **Manipulations** - Track image manipulations and transformations
✅ **Conversions** - Support for generated conversions (thumbnails, webp, etc.)
✅ **Responsive Images** - Track responsive image variants
✅ **UUID Support** - Each media has a unique UUID
✅ **Full CRUD API** - Complete REST API for media management

---

## 📊 Database Schema

```prisma
model Media {
  id        BigInt   @id @default(autoincrement())
  
  // Polymorphic relation
  modelType String   // "product", "user", "order", etc.
  modelId   BigInt   // ID of the related model
  
  // Core media info
  uuid              String?  @unique
  collectionName    String   // "images", "documents", "avatars", etc.
  name              String   // Original filename without extension
  fileName          String   // Stored filename with extension
  mimeType          String?  // "image/jpeg", "application/pdf", etc.
  disk              String   // "local", "s3", "azure"
  conversionsDisk   String?  // Disk for storing conversions
  size              BigInt   // File size in bytes
  orderColumn       Int?     // Order within collection
  
  // JSON metadata
  manipulations       Json   // Image manipulations applied
  customProperties    Json   // Custom metadata
  generatedConversions Json  // Generated versions (thumbnails, etc.)
  responsiveImages    Json   // Responsive image variants
  
  createdAt DateTime
  updatedAt DateTime

  @@index([modelType, modelId])
  @@index([collectionName])
}
```

---

## 🚀 Quick Start

### 1. Configuration

Add to `.env`:

```env
# Storage Provider
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_URL=http://localhost:3000

# File Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf
```

### 2. Database Migration

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 3. Start Server

```bash
npm run dev
```

---

## 📡 API Endpoints

### Upload Media

**Single File:**
```http
POST /api/admin/media/single
POST /api/app/media/single

Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
  file: <binary>
  modelType: "product"
  modelId: 123
  collectionName: "images"
  customProperties: {"featured": true, "alt": "Product image"}
  orderColumn: 1
```

**Multiple Files:**
```http
POST /api/admin/media/multiple
POST /api/app/media/multiple

Body:
  files: <binaries>
  modelType: "product"
  modelId: 123
  collectionName: "gallery"
```

### Get Media

**By ID:**
```http
GET /api/admin/media/:id
GET /api/app/media/:id
```

**By UUID:**
```http
GET /api/admin/media/uuid/:uuid
GET /api/app/media/uuid/:uuid
```

**By Model (Polymorphic):**
```http
GET /api/admin/media/model/:modelType/:modelId?collectionName=images
GET /api/app/media/model/:modelType/:modelId

Example:
GET /api/admin/media/model/product/123?collectionName=images
```

**List with Filters:**
```http
GET /api/admin/media?page=1&limit=20&modelType=product&collectionName=images
GET /api/app/media?page=1&limit=20
```

### Update Media

**Custom Properties:**
```http
PATCH /api/admin/media/:id/custom-properties

Body:
{
  "customProperties": {
    "alt": "Updated alt text",
    "caption": "Beautiful sunset"
  }
}
```

**Manipulations:**
```http
PATCH /api/admin/media/:id/manipulations

Body:
{
  "manipulations": {
    "resize": {"width": 800, "height": 600},
    "crop": {"x": 10, "y": 10, "width": 500, "height": 500}
  }
}
```

**Order:**
```http
PATCH /api/admin/media/:id/order

Body:
{
  "orderColumn": 5
}
```

### Reorder Media

```http
POST /api/admin/media/reorder/:modelType/:modelId/:collectionName

Body:
{
  "orderedIds": [5, 3, 1, 2, 4]
}

Example:
POST /api/admin/media/reorder/product/123/images
```

### Delete Media

**Single:**
```http
DELETE /api/admin/media/:id
DELETE /api/app/media/:id
```

**Multiple:**
```http
POST /api/admin/media/delete-multiple

Body:
{
  "ids": [1, 2, 3, 4, 5]
}
```

### Statistics

```http
GET /api/admin/media/stats
```

---

## 💡 Usage Examples

### Upload Product Images

```typescript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('modelType', 'product');
formData.append('modelId', '123');
formData.append('collectionName', 'images');
formData.append('customProperties', JSON.stringify({
  featured: true,
  alt: 'Blue Widget Pro'
}));

const response = await fetch('/api/admin/media/single', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded:', result.data);
```

### Get All Product Images

```typescript
const response = await fetch(
  '/api/admin/media/model/product/123?collectionName=images',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { data } = await response.json();
// data is array of media objects sorted by orderColumn
data.forEach(media => {
  console.log(media.fileName, media.url, media.customProperties);
});
```

### Upload User Avatar

```typescript
const formData = new FormData();
formData.append('file', avatarFile);
formData.append('modelType', 'user');
formData.append('modelId', userId);
formData.append('collectionName', 'avatar');

await fetch('/api/app/media/single', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Reorder Gallery Images

```typescript
// User drags images to new order: [5, 3, 1, 2, 4]
await fetch('/api/admin/media/reorder/product/123/gallery', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderedIds: [5, 3, 1, 2, 4]
  })
});
```

---

## 🎯 Use Cases

### 1. E-Commerce Product Gallery

```typescript
// Upload product images
const images = [img1, img2, img3];
const formData = new FormData();
images.forEach(img => formData.append('files', img));
formData.append('modelType', 'product');
formData.append('modelId', productId);
formData.append('collectionName', 'gallery');

await upload('/api/admin/media/multiple', formData);

// Get product gallery
const gallery = await fetch(
  `/api/admin/media/model/product/${productId}?collectionName=gallery`
);
```

### 2. User Profile Management

```typescript
// Upload avatar
await uploadMedia({
  file: avatarFile,
  modelType: 'user',
  modelId: userId,
  collectionName: 'avatar'
});

// Upload documents
await uploadMedia({
  file: idCard,
  modelType: 'user',
  modelId: userId,
  collectionName: 'documents'
});

// Get user avatar
const avatar = await fetch(
  `/api/app/media/model/user/${userId}?collectionName=avatar`
);

// Get user documents
const docs = await fetch(
  `/api/app/media/model/user/${userId}?collectionName=documents`
);
```

### 3. Blog Post Images

```typescript
// Upload featured image
await uploadMedia({
  file: featuredImage,
  modelType: 'post',
  modelId: postId,
  collectionName: 'featured',
  customProperties: {
    alt: 'Featured Image',
    caption: 'A beautiful sunset'
  }
});

// Upload content images
await uploadMultipleMedia({
  files: [img1, img2, img3],
  modelType: 'post',
  modelId: postId,
  collectionName: 'content'
});
```

### 4. Order Attachments

```typescript
// Upload invoice
await uploadMedia({
  file: invoicePdf,
  modelType: 'order',
  modelId: orderId,
  collectionName: 'invoices'
});

// Upload receipt
await uploadMedia({
  file: receiptPdf,
  modelType: 'order',
  modelId: orderId,
  collectionName: 'receipts'
});
```

---

## 🔄 Storage Providers

### Switch from Local to S3

**Update `.env`:**
```env
STORAGE_PROVIDER=s3
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=my-bucket
AWS_S3_ACCESS_KEY_ID=your-key
AWS_S3_SECRET_ACCESS_KEY=your-secret
```

**Restart:** `npm run dev`

All new uploads go to S3. No code changes needed!

### Switch from Local to Azure

**Update `.env`:**
```env
STORAGE_PROVIDER=azure
AZURE_STORAGE_ACCOUNT_NAME=myaccount
AZURE_STORAGE_ACCOUNT_KEY=mykey
AZURE_STORAGE_CONTAINER=media
```

**Restart:** `npm run dev`

Done!

---

## 📚 Collections

Collections help organize media by type:

- **`images`** - Product/content images
- **`documents`** - PDF files, documents
- **`avatar`** - User profile pictures
- **`gallery`** - Image galleries
- **`attachments`** - Generic attachments
- **`featured`** - Featured/hero images
- **`thumbnails`** - Generated thumbnails
- **Custom** - Any name you want!

---

## 🎨 Custom Properties

Store additional metadata with each media:

```typescript
{
  "customProperties": {
    "alt": "Product image",
    "caption": "Beautiful blue widget",
    "featured": true,
    "copyright": "© 2025 MyCompany",
    "photographer": "John Doe",
    "tags": ["blue", "widget", "product"],
    "seo": {
      "title": "Blue Widget Pro",
      "description": "High quality blue widget"
    }
  }
}
```

Access in response:
```typescript
media.customProperties.alt // "Product image"
media.customProperties.featured // true
media.customProperties.tags // ["blue", "widget", "product"]
```

---

## 🔧 Manipulations

Track image manipulations:

```typescript
{
  "manipulations": {
    "resize": {"width": 800, "height": 600},
    "crop": {"x": 10, "y": 10, "width": 500, "height": 500},
    "filter": "grayscale",
    "quality": 85,
    "format": "webp"
  }
}
```

---

## 📈 Statistics

Get storage statistics:

```typescript
const stats = await fetch('/api/admin/media/stats');

// Response:
{
  "totalMedia": 1523,
  "totalSize": "15728640000",
  "byDisk": {
    "s3": {"count": 1200, "size": "12000000000"},
    "local": {"count": 323, "size": "3728640000"}
  },
  "byMimeType": {
    "image/jpeg": {"count": 800, "size": "8000000000"},
    "image/png": {"count": 400, "size": "4000000000"}
  },
  "byCollection": {
    "images": {"count": 900, "size": "9000000000"},
    "documents": {"count": 300, "size": "3000000000"},
    "avatars": {"count": 323, "size": "1728640000"}
  }
}
```

---

## 🔐 Security

- ✅ Authentication required (admin or user)
- ✅ File type validation
- ✅ File size limits
- ✅ MIME type checking
- ✅ Polymorphic relations for access control

---

## 🎁 Advanced Features

### UUID Support

Each media has a unique UUID for external references:

```typescript
// Upload returns UUID
const media = await uploadMedia(...);
console.log(media.uuid); // "550e8400-e29b-41d4-a716-446655440000"

// Get by UUID
const media = await fetch(`/api/admin/media/uuid/${uuid}`);
```

### Order Management

Media in collections are ordered:

```typescript
// Upload with specific order
await uploadMedia({
  file: image,
  modelType: 'product',
  modelId: 123,
  collectionName: 'gallery',
  orderColumn: 5
});

// Update order
await updateMediaOrder(mediaId, 3);

// Reorder entire collection
await reorderMedia('product', 123, 'gallery', [5, 3, 1, 2, 4]);
```

---

## 🛠️ Programmatic Usage

```typescript
import { mediaService } from '@/core/services/media.service';

// Upload media
const media = await mediaService.uploadSingleMedia(file, {
  modelType: 'product',
  modelId: 123,
  collectionName: 'images',
  customProperties: { featured: true }
});

// Get media by model
const productMedia = await mediaService.getMediaByModel('product', 123);

// Get media by collection
const gallery = await mediaService.getMediaByModel('product', 123, 'gallery');

// Update custom properties
await mediaService.updateCustomProperties(mediaId, {
  alt: 'Updated alt text',
  featured: true
});

// Delete media
await mediaService.deleteMedia(mediaId);

// Get statistics
const stats = await mediaService.getStorageStats();
```

---

## 📝 Response Format

```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "id": "1",
    "modelType": "product",
    "modelId": "123",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "collectionName": "images",
    "name": "blue-widget",
    "fileName": "blue-widget_1697234567_abc.jpg",
    "mimeType": "image/jpeg",
    "disk": "s3",
    "conversionsDisk": null,
    "size": "524288",
    "orderColumn": 1,
    "manipulations": {},
    "customProperties": {
      "featured": true,
      "alt": "Blue Widget Pro"
    },
    "generatedConversions": {},
    "responsiveImages": {},
    "createdAt": "2025-10-10T10:30:00.000Z",
    "updatedAt": "2025-10-10T10:30:00.000Z"
  }
}
```

---

## 🎉 Summary

You now have a **production-ready media management system** that:

- ✅ Supports any model with polymorphic relations
- ✅ Organizes media in collections
- ✅ Works with multiple storage providers
- ✅ Tracks metadata, manipulations, and conversions
- ✅ Provides complete REST API
- ✅ Scales from development to production

**Happy coding! 🚀**

