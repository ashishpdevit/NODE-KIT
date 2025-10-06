# Dashboard API Response Examples

## Laravel-Style Pagination Response Structure

All paginated endpoints now return responses in Laravel's standard pagination format:

### Example Response Structure

```json
{
  "status": true,
  "message": "Customers fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "status": "Active",
      "country": "US",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "_count": {
        "orders": 5
      }
    }
  ],
  "links": {
    "first": "https://yourdomain.com/api/admin/dashboard/customers?page=1&per_page=20&sortBy=name&sortOrder=asc&search=company",
    "last": "https://yourdomain.com/api/admin/dashboard/customers?page=5&per_page=20&sortBy=name&sortOrder=asc&search=company",
    "prev": "https://yourdomain.com/api/admin/dashboard/customers?page=1&per_page=20&sortBy=name&sortOrder=asc&search=company",
    "next": "https://yourdomain.com/api/admin/dashboard/customers?page=3&per_page=20&sortBy=name&sortOrder=asc&search=company"
  },
  "meta": {
    "current_page": 2,
    "from": 21,
    "last_page": 5,
    "links": [
      {
        "url": "https://yourdomain.com/api/admin/dashboard/customers?page=1&per_page=20&sortBy=name&sortOrder=asc&search=company",
        "label": "&laquo; Previous",
        "active": false
      },
      {
        "url": "https://yourdomain.com/api/admin/dashboard/customers?page=1&per_page=20&sortBy=name&sortOrder=asc&search=company",
        "label": "1",
        "active": false
      },
      {
        "url": null,
        "label": "2",
        "active": true
      },
      {
        "url": "https://yourdomain.com/api/admin/dashboard/customers?page=3&per_page=20&sortBy=name&sortOrder=asc&search=company",
        "label": "3",
        "active": false
      },
      {
        "url": "https://yourdomain.com/api/admin/dashboard/customers?page=4&per_page=20&sortBy=name&sortOrder=asc&search=company",
        "label": "4",
        "active": false
      },
      {
        "url": "https://yourdomain.com/api/admin/dashboard/customers?page=5&per_page=20&sortBy=name&sortOrder=asc&search=company",
        "label": "5",
        "active": false
      },
      {
        "url": "https://yourdomain.com/api/admin/dashboard/customers?page=3&per_page=20&sortBy=name&sortOrder=asc&search=company",
        "label": "Next &raquo;",
        "active": false
      }
    ],
    "path": "https://yourdomain.com/api/admin/dashboard/customers",
    "per_page": 20,
    "to": 40,
    "total": 95
  }
}
```

### Empty Results Example

```json
{
  "status": true,
  "message": "Customers fetched successfully",
  "data": [],
  "links": {
    "first": "https://yourdomain.com/api/admin/dashboard/customers?page=1&per_page=20",
    "last": "https://yourdomain.com/api/admin/dashboard/customers?page=1&per_page=20",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": null,
    "last_page": 1,
    "links": [],
    "path": "https://yourdomain.com/api/admin/dashboard/customers",
    "per_page": 20,
    "to": null,
    "total": 0
  }
}
```

## Available Endpoints

### Dashboard Paginated Endpoints

1. **Recent Activities**
   - `GET /api/admin/dashboard/activities/recent`
   - Query params: `page`, `per_page`, `sortBy`, `sortOrder`, `search`

2. **Customers**
   - `GET /api/admin/dashboard/customers`
   - Query params: `page`, `per_page`, `sortBy`, `sortOrder`, `search`

3. **Orders**
   - `GET /api/admin/dashboard/orders`
   - Query params: `page`, `per_page`, `sortBy`, `sortOrder`, `search`

4. **Products**
   - `GET /api/admin/dashboard/products`
   - Query params: `page`, `per_page`, `sortBy`, `sortOrder`, `search`

5. **Contact Requests**
   - `GET /api/admin/dashboard/contact-requests`
   - Query params: `page`, `per_page`, `sortBy`, `sortOrder`, `search`

### Products API

- `GET /api/admin/products`
- Query params: `page`, `per_page`, `sortBy`, `sortOrder`, `search`, `status`, `category`, `tag`

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `per_page` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | - | Field to sort by |
| `sortOrder` | string | - | Sort direction (`asc` or `desc`) |
| `search` | string | - | Search query |
| `searchFields` | string | - | Comma-separated fields to search |

## Response Fields

### Links Object
- `first`: URL to first page
- `last`: URL to last page  
- `prev`: URL to previous page (null if on first page)
- `next`: URL to next page (null if on last page)

### Meta Object
- `current_page`: Current page number
- `from`: Starting item number on current page
- `last_page`: Total number of pages
- `links`: Array of page navigation links
- `path`: Base URL path
- `per_page`: Items per page
- `to`: Ending item number on current page
- `total`: Total number of items

### Data Array
Contains the actual paginated results for the current page.
