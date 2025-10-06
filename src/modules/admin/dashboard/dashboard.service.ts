import { prisma } from "@/core/lib/prisma";
import type { 
  PaginationOptions, 
  SortOptions, 
  SearchOptions, 
  PaginatedResult 
} from "@/core/utils/pagination";
import { createPaginatedResponse } from "@/core/utils/pagination";

export interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  orderCount: number;
}

export interface ProductCategoryStats {
  category: string;
  count: number;
  totalInventory: number;
}

export interface RecentActivity {
  type: string;
  description: string;
  createdAt: Date;
  id: string | number;
}

export const dashboardService = {
  // Get overall dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const [
      totalCustomers,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
      }),   
    ]);

    return {
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    };
  },

  // Get order status distribution
  getOrderStatusCounts: async (): Promise<OrderStatusCount[]> => {
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));
  },

  // Get monthly revenue data for the last 12 months
  getMonthlyRevenue: async (): Promise<MonthlyRevenue[]> => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group by month and year
    const monthlyData = orders.reduce((acc, order) => {
      const month = order.createdAt.getMonth() + 1; // 1-12
      const year = order.createdAt.getFullYear();
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      if (!acc[key]) {
        acc[key] = {
          month: `${year}-${month.toString().padStart(2, '0')}`,
          year,
          revenue: 0,
          orderCount: 0,
        };
      }

      acc[key].revenue += order.total;
      acc[key].orderCount += 1;

      return acc;
    }, {} as Record<string, MonthlyRevenue>);

    // Convert to array and sort by month
    return Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return parseInt(a.month.split('-')[1]) - parseInt(b.month.split('-')[1]);
    });
  },

  // Get product category statistics
  getProductCategoryStats: async (): Promise<ProductCategoryStats[]> => {
    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      _sum: {
        inventory: true,
      },
    });

    return categoryStats.map((item) => ({
      category: item.category,
      count: item._count.category,
      totalInventory: item._sum.inventory || 0,
    }));
  },

  // Get recent activities (orders, customers, contact requests) with pagination
  getRecentActivities: async (
    pagination: PaginationOptions,
    sort?: SortOptions | null,
    search?: SearchOptions | null
  ): Promise<PaginatedResult<RecentActivity>> => {
    // Build where clause for search
    const searchWhere = search ? {
      OR: [
        {
          customerName: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          id: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
      ],
    } : undefined;

    // Get recent orders with pagination
    const [recentOrders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: searchWhere,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: sort ? { [sort.field]: sort.direction } : { createdAt: 'desc' },
        select: {
          id: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.order.count({ where: searchWhere }),
    ]);

    const activities: RecentActivity[] = recentOrders.map((order) => ({
      type: 'order',
      description: `New order ${order.id} from ${order.customerName} - $${order.total}`,
      createdAt: order.createdAt,
      id: order.id,
    }));

    return createPaginatedResponse(
      activities,
      totalOrders,
      pagination,
      '/api/admin/dashboard/activities/recent',
      { 
        ...(sort?.field && { sortBy: sort.field }), 
        ...(sort?.direction && { sortOrder: sort.direction }), 
        ...(search?.query && { search: search.query })
      }
    );
  },

  // Get customers with pagination, search, and sorting
  getCustomers: async (
    pagination: PaginationOptions,
    sort?: SortOptions | null,
    search?: SearchOptions | null
  ) => {
    const searchWhere = search ? {
      OR: [
        {
          name: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          email: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          company: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
      ],
    } : undefined;

    const orderBy = sort ? { [sort.field]: sort.direction } : { createdAt: 'desc' as const };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: searchWhere,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          status: true,
          country: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      }),
      prisma.customer.count({ where: searchWhere }),
    ]);

    return createPaginatedResponse(
      customers,
      total,
      pagination,
      '/api/admin/dashboard/customers',
      { 
        ...(sort?.field && { sortBy: sort.field }), 
        ...(sort?.direction && { sortOrder: sort.direction }), 
        ...(search?.query && { search: search.query })
      }
    );
  },

  // Get orders with pagination, search, and sorting
  getOrders: async (
    pagination: PaginationOptions,
    sort?: SortOptions | null,
    search?: SearchOptions | null
  ) => {
    const searchWhere = search ? {
      OR: [
        {
          id: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          customerName: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          status: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
      ],
    } : undefined;

    const orderBy = sort ? { [sort.field]: sort.direction } : { createdAt: 'desc' as const };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: searchWhere,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        select: {
          id: true,
          customerName: true,
          total: true,
          status: true,
          date: true,
          customerId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.order.count({ where: searchWhere }),
    ]);

    return createPaginatedResponse(
      orders,
      total,
      pagination,
      '/api/admin/dashboard/orders',
      { 
        ...(sort?.field && { sortBy: sort.field }), 
        ...(sort?.direction && { sortOrder: sort.direction }), 
        ...(search?.query && { search: search.query })
      }
    );
  },

  // Get products with pagination, search, and sorting
  getProducts: async (
    pagination: PaginationOptions,
    sort?: SortOptions | null,
    search?: SearchOptions | null
  ) => {
    const searchWhere = search ? {
      OR: [
        {
          name: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          sku: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          category: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          brand: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
      ],
    } : undefined;

    const orderBy = sort ? { [sort.field]: sort.direction } : { createdAt: 'desc' as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: searchWhere,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        select: {
          id: true,
          name: true,
          price: true,
          inventory: true,
          status: true,
          category: true,
          sku: true,
          brand: true,
          featured: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.product.count({ where: searchWhere }),
    ]);

    return createPaginatedResponse(
      products,
      total,
      pagination,
      '/api/admin/dashboard/products',
      { 
        ...(sort?.field && { sortBy: sort.field }), 
        ...(sort?.direction && { sortOrder: sort.direction }), 
        ...(search?.query && { search: search.query })
      }
    );
  },

  // Get contact requests with pagination, search, and sorting
  getContactRequests: async (
    pagination: PaginationOptions,
    sort?: SortOptions | null,
    search?: SearchOptions | null
  ) => {
    const searchWhere = search ? {
      OR: [
        {
          contact: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          message: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
        {
          status: {
            contains: search.query,
            mode: "insensitive" as const,
          },
        },
      ],
    } : undefined;

    const orderBy = sort ? { [sort.field]: sort.direction } : { createdAt: 'desc' as const };

    const [contactRequests, total] = await Promise.all([
      prisma.contactRequest.findMany({
        where: searchWhere,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        select: {
          id: true,
          message: true,
          contact: true,
          status: true,
          adminReply: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.contactRequest.count({ where: searchWhere }),
    ]);

    return createPaginatedResponse(
      contactRequests,
      total,
      pagination,
      '/api/admin/dashboard/contact-requests',
      { 
        ...(sort?.field && { sortBy: sort.field }), 
        ...(sort?.direction && { sortOrder: sort.direction }), 
        ...(search?.query && { search: search.query })
      }
    );
  },

  // Get top customers by order count
  getTopCustomers: async (limit: number = 5) => {
    const topCustomers = await prisma.customer.findMany({
      take: limit,
      orderBy: {
        orders: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        orders: {
          select: {
            total: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return topCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      orderCount: customer._count.orders,
      totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
    }));
  },

  // Get low inventory products
  getLowInventoryProducts: async (threshold: number = 10) => {
    return prisma.product.findMany({
      where: {
        inventory: {
          lte: threshold,
        },
      },
      select: {
        id: true,
        name: true,
        inventory: true,
        category: true,
        status: true,
      },
      orderBy: {
        inventory: 'asc',
      },
    });
  },
};
