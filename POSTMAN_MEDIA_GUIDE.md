# 📬 Postman - Media Library API Guide

## ✅ What Was Added

The Postman collection has been updated with **Media Library** endpoints for both Admin and App sections.

---

## 📡 Admin Media Endpoints (13 requests)

### Upload
1. **Upload Single Media** - `POST /api/admin/media/single`
   - Upload one file with form-data
   - Fields: file, modelType, modelId, collectionName, customProperties

2. **Upload Multiple Media** - `POST /api/admin/media/multiple`
   - Upload multiple files
   - Fields: files (multiple), modelType, modelId, collectionName

### Get
3. **List Media** - `GET /api/admin/media?page=1&limit=20`
   - List all media with pagination
   - Optional filters: modelType, collectionName

4. **Get Media by ID** - `GET /api/admin/media/{{mediaId}}`
   - Get specific media by ID

5. **Get Media by UUID** - `GET /api/admin/media/uuid/{{mediaUuid}}`
   - Get specific media by UUID

6. **Get Media by Model** - `GET /api/admin/media/model/product/{{productId}}?collectionName=gallery`
   - Get all media for a specific model
   - Optional: filter by collection

### Update
7. **Update Custom Properties** - `PATCH /api/admin/media/{{mediaId}}/custom-properties`
   - Update media metadata

8. **Update Manipulations** - `PATCH /api/admin/media/{{mediaId}}/manipulations`
   - Update image manipulations

9. **Update Order** - `PATCH /api/admin/media/{{mediaId}}/order`
   - Change order within collection

10. **Reorder Media Collection** - `POST /api/admin/media/reorder/product/{{productId}}/gallery`
    - Reorder entire collection (drag & drop)

### Delete
11. **Delete Media** - `DELETE /api/admin/media/{{mediaId}}`
    - Delete single media

12. **Delete Multiple Media** - `POST /api/admin/media/delete-multiple`
    - Delete multiple media at once

### Stats
13. **Get Storage Statistics** - `GET /api/admin/media/stats`
    - Get storage usage statistics

---

## 📱 App/User Media Endpoints (7 requests)

1. **Upload Single Media** - `POST /api/app/media/single`
   - Upload user avatar, documents, etc.

2. **Upload Multiple Media** - `POST /api/app/media/multiple`
   - Upload multiple files

3. **List My Media** - `GET /api/app/media?page=1&limit=20`
   - List user's media

4. **Get Media by ID** - `GET /api/app/media/{{mediaId}}`
   - Get specific media

5. **Get Media by Model** - `GET /api/app/media/model/user/1?collectionName=avatar`
   - Get media for specific model

6. **Delete Media** - `DELETE /api/app/media/{{mediaId}}`
   - Delete user's media

7. **Update Custom Properties** - `PATCH /api/app/media/{{mediaId}}/custom-properties`
   - Update media metadata

---

## 🔑 Postman Variables Added

```
mediaId      = "1"        // ID of media to test
mediaUuid    = ""         // UUID after upload
```

---

## 🧪 Testing Steps

### 1. Login as Admin

Run: **Admin > Auth > Login**

This will set `{{adminToken}}` variable.

### 2. Upload Product Images

Run: **Admin > Media Library > Upload Single Media**

Before running:
1. Click on "file" field in Body
2. Select a file from your computer
3. Update `modelType` to "product"
4. Update `modelId` to your product ID (e.g., 1)
5. Update `collectionName` to "images" or "gallery"
6. Send request

**Response will include:**
```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "id": "1",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "modelType": "product",
    "modelId": "1",
    "collectionName": "images",
    "fileName": "image_1697234567_abc.jpg",
    "url": "http://localhost:3000/default/image_1697234567_abc.jpg",
    ...
  }
}
```

### 3. Get Product Media

Run: **Admin > Media Library > Get Media by Model**

This will return all media for the product.

### 4. Upload Multiple Images

Run: **Admin > Media Library > Upload Multiple Media**

Before running:
1. Add multiple files in the "files" field
2. Update modelType and modelId
3. Send request

### 5. Reorder Gallery

Run: **Admin > Media Library > Reorder Media Collection**

The body contains example ordered IDs: `[5, 3, 1, 2, 4]`

### 6. Get Statistics

Run: **Admin > Media Library > Get Storage Statistics**

This shows storage usage by disk, mime type, and collection.

---

## 📝 Example Workflows

### Upload User Avatar (App)

1. Login: **App > Auth > Login**
2. Upload: **App > Media Library > Upload Single Media**
   - file: Select avatar image
   - modelType: "user"
   - modelId: User's ID
   - collectionName: "avatar"

### Upload Product Gallery (Admin)

1. Login: **Admin > Auth > Login**
2. Create Product: **Admin > Products > Create Product**
3. Upload Images: **Admin > Media Library > Upload Multiple Media**
   - files: Select 3-5 product images
   - modelType: "product"
   - modelId: Product ID from step 2
   - collectionName: "gallery"
4. View Gallery: **Admin > Media Library > Get Media by Model**
5. Reorder: **Admin > Media Library > Reorder Media Collection**
   - Update orderedIds based on media IDs from step 4

---

## 🎯 Field Descriptions

### Upload Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `file` or `files` | File | ✅ Yes | File(s) to upload | image.jpg |
| `modelType` | Text | ✅ Yes | Type of model | "product", "user", "order" |
| `modelId` | Text | ✅ Yes | ID of the model | "123" |
| `collectionName` | Text | No | Collection name | "images", "gallery", "avatar" |
| `customProperties` | Text (JSON) | No | Custom metadata | `{"featured": true, "alt": "..."}` |
| `orderColumn` | Text | No | Order in collection | "1" |
| `manipulations` | Text (JSON) | No | Image manipulations | `{"resize": {...}}` |

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number | 1 |
| `limit` | Items per page | 20 |
| `modelType` | Filter by model type | "product" |
| `modelId` | Filter by model ID | "123" |
| `collectionName` | Filter by collection | "images" |
| `disk` | Filter by storage disk | "local", "s3", "azure" |
| `mimeType` | Filter by MIME type | "image/jpeg" |

---

## 🔄 Common Use Cases

### 1. Product Image Gallery

```
1. Upload Multiple Media
   - modelType: "product"
   - modelId: "123"
   - collectionName: "gallery"
   
2. Get Media by Model
   - /api/admin/media/model/product/123?collectionName=gallery
   
3. Reorder if needed
   - /api/admin/media/reorder/product/123/gallery
   - Body: {"orderedIds": [3, 1, 2]}
```

### 2. User Avatar

```
1. Upload Single Media (App endpoint)
   - modelType: "user"
   - modelId: "456"
   - collectionName: "avatar"
   
2. Get User Avatar
   - /api/app/media/model/user/456?collectionName=avatar
```

### 3. Order Attachments

```
1. Upload Documents
   - modelType: "order"
   - modelId: "789"
   - collectionName: "invoices"
   
2. Get Order Documents
   - /api/admin/media/model/order/789?collectionName=invoices
```

---

## 💡 Tips

### Setting Variables

After uploading media, copy the `id` and `uuid` from response:
1. Go to Variables tab
2. Set `mediaId` to the ID from response
3. Set `mediaUuid` to the UUID from response

### File Upload in Postman

1. Select request with file upload
2. Go to Body tab
3. Select "form-data"
4. Find the "file" or "files" field
5. Change type dropdown from "Text" to "File"
6. Click "Select Files" button
7. Choose your file(s)
8. Send request

### Custom Properties Format

Must be valid JSON string:
```json
"{\"featured\": true, \"alt\": \"Product image\", \"caption\": \"Beautiful widget\"}"
```

Or use the JSON format:
```json
{
  "customProperties": {
    "featured": true,
    "alt": "Product image",
    "caption": "Beautiful widget"
  }
}
```

---

## 📚 Documentation

- **MEDIA_LIBRARY_SYSTEM.md** - Complete API documentation
- **MEDIA_QUICK_START.md** - Quick start guide
- **START_HERE_MEDIA.txt** - Quick reference

---

## ✅ Import Postman Collection

1. Open Postman
2. Click "Import"
3. Select `postman/Node-Starter-Kit.postman_collection.json`
4. Collection will appear with Media Library folder
5. Set environment variables:
   - `baseUrl` = `http://localhost:3000`
   - `apiKey` = Your API key
6. Login to get tokens
7. Start testing Media endpoints!

---

**Happy Testing! 🚀**

