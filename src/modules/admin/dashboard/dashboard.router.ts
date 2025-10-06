import { Router } from "express";

import {
  getDashboardOverview,
  getDashboardStats,
  getLowInventoryProducts,
  getMonthlyRevenue,
  getOrderStatusCounts,
  getProductCategoryStats,
  getRecentActivities,
  getTopCustomers,
  getCustomers,
  getOrders,
  getProducts,
  getContactRequests,
} from "./dashboard.controller";

export const dashboardRouter = Router();

// Main dashboard overview endpoint - returns all dashboard data in one call
dashboardRouter.get("/overview", getDashboardOverview);

// Individual endpoints for specific dashboard components
dashboardRouter.get("/stats", getDashboardStats);
dashboardRouter.get("/orders/status-counts", getOrderStatusCounts);
dashboardRouter.get("/revenue/monthly", getMonthlyRevenue);
dashboardRouter.get("/products/category-stats", getProductCategoryStats);
dashboardRouter.get("/activities/recent", getRecentActivities);
dashboardRouter.get("/customers/top", getTopCustomers);
dashboardRouter.get("/products/low-inventory", getLowInventoryProducts);

// Paginated listing endpoints with search and sorting
dashboardRouter.get("/customers", getCustomers);
dashboardRouter.get("/orders", getOrders);
dashboardRouter.get("/products", getProducts);
dashboardRouter.get("/contact-requests", getContactRequests);
