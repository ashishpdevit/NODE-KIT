import type { Request } from "express";

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface SearchOptions {
  query: string;
  fields: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  searchFields?: string;
}

// Default pagination values
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from request query
 */
export const parsePaginationParams = (req: Request): PaginationOptions => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : DEFAULT_PAGE;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : DEFAULT_LIMIT;

  // Validate and sanitize
  const validPage = Math.max(1, isNaN(page) ? DEFAULT_PAGE : page);
  const validLimit = Math.min(Math.max(1, isNaN(limit) ? DEFAULT_LIMIT : limit), MAX_LIMIT);
  const offset = (validPage - 1) * validLimit;

  return {
    page: validPage,
    limit: validLimit,
    offset,
  };
};

/**
 * Parse sorting parameters from request query
 */
export const parseSortParams = (req: Request, allowedFields: string[] = []): SortOptions | null => {
  const sortBy = req.query.sortBy as string;
  const sortOrder = req.query.sortOrder as string;

  if (!sortBy) return null;

  // Validate sort field
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return null;
  }

  // Validate sort direction
  const direction = sortOrder === "desc" ? "desc" : "asc";

  return {
    field: sortBy,
    direction,
  };
};

/**
 * Parse search parameters from request query
 */
export const parseSearchParams = (req: Request, defaultFields: string[] = []): SearchOptions | null => {
  const search = req.query.search as string;
  const searchFields = req.query.searchFields as string;

  if (!search || search.trim().length === 0) return null;

  // Parse search fields
  const fields = searchFields
    ? searchFields.split(",").map((field) => field.trim()).filter(Boolean)
    : defaultFields;

  return {
    query: search.trim(),
    fields,
  };
};

/**
 * Create Prisma orderBy clause from sort options
 */
export const createOrderByClause = (sortOptions: SortOptions | null) => {
  if (!sortOptions) return undefined;
  
  return {
    [sortOptions.field]: sortOptions.direction,
  };
};

/**
 * Create Prisma where clause for search
 */
export const createSearchWhereClause = (searchOptions: SearchOptions | null, model: string) => {
  if (!searchOptions || searchOptions.fields.length === 0) return undefined;

  const searchConditions = searchOptions.fields.map((field) => ({
    [field]: {
      contains: searchOptions.query,
      mode: "insensitive" as const,
    },
  }));

  return {
    OR: searchConditions,
  };
};

/**
 * Calculate pagination metadata in Laravel style
 */
export const calculatePaginationMeta = (
  total: number, 
  page: number, 
  limit: number, 
  basePath: string,
  queryParams: Record<string, string | number> = {}
) => {
  const lastPage = Math.ceil(total / limit);
  const from = total > 0 ? (page - 1) * limit + 1 : null;
  const to = total > 0 ? Math.min(page * limit, total) : null;

  // Build query string for URLs
  const buildQueryString = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set('page', pageNum.toString());
    params.set('per_page', limit.toString());
    
    // Add other query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'per_page' && value !== undefined) {
        params.set(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  // Generate page links
  const links = [];
  
  // Previous page
  if (page > 1) {
    links.push({
      url: `${basePath}${buildQueryString(page - 1)}`,
      label: '&laquo; Previous',
      active: false,
    });
  }

  // Page numbers (show up to 7 pages around current page)
  const startPage = Math.max(1, page - 3);
  const endPage = Math.min(lastPage, page + 3);

  // Show first page if not in range
  if (startPage > 1) {
    links.push({
      url: `${basePath}${buildQueryString(1)}`,
      label: '1',
      active: false,
    });
    if (startPage > 2) {
      links.push({
        url: null,
        label: '...',
        active: false,
      });
    }
  }

  // Show pages in range
  for (let i = startPage; i <= endPage; i++) {
    links.push({
      url: i === page ? null : `${basePath}${buildQueryString(i)}`,
      label: i.toString(),
      active: i === page,
    });
  }

  // Show last page if not in range
  if (endPage < lastPage) {
    if (endPage < lastPage - 1) {
      links.push({
        url: null,
        label: '...',
        active: false,
      });
    }
    links.push({
      url: `${basePath}${buildQueryString(lastPage)}`,
      label: lastPage.toString(),
      active: false,
    });
  }

  // Next page
  if (page < lastPage) {
    links.push({
      url: `${basePath}${buildQueryString(page + 1)}`,
      label: 'Next &raquo;',
      active: false,
    });
  }

  return {
    current_page: page,
    from,
    last_page: lastPage,
    links,
    path: basePath,
    per_page: limit,
    to,
    total,
  };
};

/**
 * Parse all list query parameters at once
 */
export const parseListQueryParams = (
  req: Request,
  allowedSortFields: string[] = [],
  defaultSearchFields: string[] = []
): {
  pagination: PaginationOptions;
  sort: SortOptions | null;
  search: SearchOptions | null;
} => {
  return {
    pagination: parsePaginationParams(req),
    sort: parseSortParams(req, allowedSortFields),
    search: parseSearchParams(req, defaultSearchFields),
  };
};

/**
 * Create a standardized paginated response in Laravel style
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  pagination: PaginationOptions,
  basePath: string,
  queryParams: Record<string, string | number> = {}
): PaginatedResult<T> => {
  const lastPage = Math.ceil(total / pagination.limit);
  const meta = calculatePaginationMeta(total, pagination.page, pagination.limit, basePath, queryParams);
  
  // Build navigation links
  const buildQueryString = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set('page', pageNum.toString());
    params.set('per_page', pagination.limit.toString());
    
    Object.entries(queryParams).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'per_page' && value !== undefined) {
        params.set(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  const links = {
    first: total > 0 ? `${basePath}${buildQueryString(1)}` : null,
    last: total > 0 ? `${basePath}${buildQueryString(lastPage)}` : null,
    prev: pagination.page > 1 ? `${basePath}${buildQueryString(pagination.page - 1)}` : null,
    next: pagination.page < lastPage ? `${basePath}${buildQueryString(pagination.page + 1)}` : null,
  };

  return {
    data,
    links,
    meta,
  };
};
