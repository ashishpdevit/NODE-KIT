# Admin Dashboard API

This module provides comprehensive dashboard analytics and statistics for the admin panel.

## API Endpoints

All endpoints require admin authentication and are prefixed with `/api/admin/dashboard`.

### 1. Dashboard Overview
**GET** `/api/admin/dashboard/overview`

Returns all dashboard data in a single request for optimal performance.

**Response:**
```json
{
  "success": true,
  "message": "Dashboard overview fetched successfully",
  "data": {
    "stats": {
      "totalCustomers": 150,
      "totalOrders": 1250,
      "totalProducts": 89,
      "totalRevenue": 125000.50,
      "totalAdmins": 5,
      "totalContactRequests": 23,
      "totalAppUsers": 300,
      "totalFaqs": 12
    },
    "charts": {
      "orderStatusCounts": [
        { "status": "pending", "count": 15 },
        { "status": "completed", "count": 1200 },
        { "status": "cancelled", "count": 35 }
      ],
      "monthlyRevenue": [
        { "month": "2024-01", "year": 2024, "revenue": 10500, "orderCount": 95 },
        { "month": "2024-02", "year": 2024, "revenue": 12100, "orderCount": 108 }
      ],
      "categoryStats": [
        { "category": "Electronics", "count": 25, "totalInventory": 500 },
        { "category": "Clothing", "count": 40, "totalInventory": 750 }
      ]
    },
    "recentActivities": [
      {
        "type": "order",
        "description": "New order ORD-001 from John Doe - $150.00",
        "createdAt": "2024-01-15T10:30:00Z",
        "id": "ORD-001"
      }
    ],
    "topCustomers": [
      {
        "id": 1,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "orderCount": 15,
        "totalSpent": 2500.00
      }
    ],
    "lowInventoryProducts": [
      {
        "id": 1,
        "name": "Wireless Headphones",
        "inventory": 5,
        "category": "Electronics",
        "status": "active"
      }
    ]
  }
}
```

### 2. Individual Statistics
**GET** `/api/admin/dashboard/stats`

Returns basic count statistics only.

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics fetched successfully",
  "data": {
    "totalCustomers": 150,
    "totalOrders": 1250,
    "totalProducts": 89,
    "totalRevenue": 125000.50,
    "totalAdmins": 5,
    "totalContactRequests": 23,
    "totalAppUsers": 300,
    "totalFaqs": 12
  }
}
```

### 3. Order Status Distribution
**GET** `/api/admin/dashboard/orders/status-counts`

Returns the count of orders grouped by status for pie/bar charts.

**Response:**
```json
{
  "success": true,
  "message": "Order status counts fetched successfully",
  "data": [
    { "status": "pending", "count": 15 },
    { "status": "completed", "count": 1200 },
    { "status": "cancelled", "count": 35 }
  ]
}
```

### 4. Monthly Revenue Data
**GET** `/api/admin/dashboard/revenue/monthly`

Returns monthly revenue data for the last 12 months for line/bar charts.

**Response:**
```json
{
  "success": true,
  "message": "Monthly revenue data fetched successfully",
  "data": [
    { "month": "2024-01", "year": 2024, "revenue": 10500, "orderCount": 95 },
    { "month": "2024-02", "year": 2024, "revenue": 12100, "orderCount": 108 }
  ]
}
```

### 5. Product Category Statistics
**GET** `/api/admin/dashboard/products/category-stats`

Returns product statistics grouped by category for pie/bar charts.

**Response:**
```json
{
  "success": true,
  "message": "Product category statistics fetched successfully",
  "data": [
    { "category": "Electronics", "count": 25, "totalInventory": 500 },
    { "category": "Clothing", "count": 40, "totalInventory": 750 }
  ]
}
```

### 6. Recent Activities
**GET** `/api/admin/dashboard/activities/recent?limit=10`

Returns recent activities (orders, customers, contact requests).

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Recent activities fetched successfully",
  "data": [
    {
      "type": "order",
      "description": "New order ORD-001 from John Doe - $150.00",
      "createdAt": "2024-01-15T10:30:00Z",
      "id": "ORD-001"
    },
    {
      "type": "customer",
      "description": "New customer registered: Jane Smith (jane@example.com)",
      "createdAt": "2024-01-15T09:15:00Z",
      "id": 150
    }
  ]
}
```

### 7. Top Customers
**GET** `/api/admin/dashboard/customers/top?limit=5`

Returns top customers by order count.

**Query Parameters:**
- `limit` (optional): Number of customers to return (default: 5, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Top customers fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "orderCount": 15,
      "totalSpent": 2500.00
    }
  ]
}
```

### 8. Low Inventory Products
**GET** `/api/admin/dashboard/products/low-inventory?threshold=10`

Returns products with low inventory levels.

**Query Parameters:**
- `threshold` (optional): Inventory threshold (default: 10, min: 0)

**Response:**
```json
{
  "success": true,
  "message": "Low inventory products fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "inventory": 5,
      "category": "Electronics",
      "status": "active"
    }
  ]
}
```

## Usage Examples

### Frontend Integration

```javascript
// Fetch complete dashboard data
const response = await fetch('/api/admin/dashboard/overview', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const dashboardData = await response.json();

// Use the data for charts and statistics
const stats = dashboardData.data.stats;
const charts = dashboardData.data.charts;
```

### Chart Library Integration

```javascript
// For Chart.js or similar libraries
const orderStatusChart = {
  type: 'doughnut',
  data: {
    labels: charts.orderStatusCounts.map(item => item.status),
    datasets: [{
      data: charts.orderStatusCounts.map(item => item.count),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
    }]
  }
};

const revenueChart = {
  type: 'line',
  data: {
    labels: charts.monthlyRevenue.map(item => item.month),
    datasets: [{
      label: 'Revenue',
      data: charts.monthlyRevenue.map(item => item.revenue)
    }]
  }
};
```

## Performance Considerations

- The `/overview` endpoint is optimized to fetch all data in parallel using `Promise.all()`
- Individual endpoints are available for cases where you only need specific data
- All endpoints include proper error handling and logging
- Database queries are optimized with proper indexing on commonly queried fields

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

Common HTTP status codes:
- `200`: Success
- `401`: Unauthorized (missing or invalid admin token)
- `500`: Internal server error
