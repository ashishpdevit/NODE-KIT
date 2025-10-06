import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { parseNumericParam } from "@/core/utils/requestHelpers";
import { parseListQueryParams } from "@/core/utils/pagination";

import { dashboardService } from "./dashboard.service";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(toSuccess("Dashboard statistics fetched successfully", stats));
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json(toError("Failed to fetch dashboard statistics"));
  }
};

export const getOrderStatusCounts = async (req: Request, res: Response) => {
  try {
    const orderStatusCounts = await dashboardService.getOrderStatusCounts();
    res.json(toSuccess("Order status counts fetched successfully", orderStatusCounts));
  } catch (error) {
    console.error("Error fetching order status counts:", error);
    res.status(500).json(toError("Failed to fetch order status counts"));
  }
};

export const getMonthlyRevenue = async (req: Request, res: Response) => {
  try {
    const monthlyRevenue = await dashboardService.getMonthlyRevenue();
    res.json(toSuccess("Monthly revenue data fetched successfully", monthlyRevenue));
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json(toError("Failed to fetch monthly revenue data"));
  }
};

export const getProductCategoryStats = async (req: Request, res: Response) => {
  try {
    const categoryStats = await dashboardService.getProductCategoryStats();
    res.json(toSuccess("Product category statistics fetched successfully", categoryStats));
  } catch (error) {
    console.error("Error fetching product category stats:", error);
    res.status(500).json(toError("Failed to fetch product category statistics"));
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const { pagination, sort, search } = parseListQueryParams(
      req,
      ["createdAt", "id", "customerName", "total", "status"],
      ["customerName", "id"]
    );
    
    const activities = await dashboardService.getRecentActivities(pagination, sort, search);
    res.json({
      status: true,
      message: "Recent activities fetched successfully",
      ...activities,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json(toError("Failed to fetch recent activities"));
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { pagination, sort, search } = parseListQueryParams(
      req,
      ["createdAt", "updatedAt", "name", "email", "status"],
      ["name", "email", "company"]
    );
    
    const customers = await dashboardService.getCustomers(pagination, sort, search);
    res.json({
      status: true,
      message: "Customers fetched successfully",
      ...customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json(toError("Failed to fetch customers"));
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { pagination, sort, search } = parseListQueryParams(
      req,
      ["createdAt", "updatedAt", "date", "total", "status", "customerName"],
      ["id", "customerName", "status"]
    );
    
    const orders = await dashboardService.getOrders(pagination, sort, search);
    res.json({
      status: true,
      message: "Orders fetched successfully",
      ...orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json(toError("Failed to fetch orders"));
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { pagination, sort, search } = parseListQueryParams(
      req,
      ["createdAt", "updatedAt", "name", "price", "inventory", "category", "status"],
      ["name", "sku", "category", "brand"]
    );
    
    const products = await dashboardService.getProducts(pagination, sort, search);
    res.json({
      status: true,
      message: "Products fetched successfully",
      ...products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json(toError("Failed to fetch products"));
  }
};

export const getContactRequests = async (req: Request, res: Response) => {
  try {
    const { pagination, sort, search } = parseListQueryParams(
      req,
      ["createdAt", "updatedAt", "contact", "status"],
      ["contact", "message", "status"]
    );
    
    const contactRequests = await dashboardService.getContactRequests(pagination, sort, search);
    res.json({
      status: true,
      message: "Contact requests fetched successfully",
      ...contactRequests,
    });
  } catch (error) {
    console.error("Error fetching contact requests:", error);
    res.status(500).json(toError("Failed to fetch contact requests"));
  }
};

export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseNumericParam(req.query.limit as string, "limit") : 5;
    const topCustomers = await dashboardService.getTopCustomers(limit);
    res.json(toSuccess("Top customers fetched successfully", topCustomers));
  } catch (error) {
    console.error("Error fetching top customers:", error);
    res.status(500).json(toError("Failed to fetch top customers"));
  }
};

export const getLowInventoryProducts = async (req: Request, res: Response) => {
  try {
    const threshold = req.query.threshold ? parseNumericParam(req.query.threshold as string, "threshold") : 10;
    const lowInventoryProducts = await dashboardService.getLowInventoryProducts(threshold);
    res.json(toSuccess("Low inventory products fetched successfully", lowInventoryProducts));
  } catch (error) {
    console.error("Error fetching low inventory products:", error);
    res.status(500).json(toError("Failed to fetch low inventory products"));
  }
};

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const [
      stats,
      orderStatusCounts,
      monthlyRevenue,
      categoryStats,
      topCustomers,
      lowInventoryProducts,
    ] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getOrderStatusCounts(),
      dashboardService.getMonthlyRevenue(),
      dashboardService.getProductCategoryStats(),
      dashboardService.getTopCustomers(5),
      dashboardService.getLowInventoryProducts(10),
    ]);

    const dashboardData = {
      stats,
      charts: {
        orderStatusCounts,
        monthlyRevenue,
        categoryStats,
      },
      topCustomers,
      lowInventoryProducts,
    };

    res.json(toSuccess("Dashboard overview fetched successfully", dashboardData));
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json(toError("Failed to fetch dashboard overview"));
  }
};
