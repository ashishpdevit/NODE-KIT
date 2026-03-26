import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";
import { parseListQueryParams } from "@/core/utils/pagination";

import { customerService } from "./customer.service";
import { customerCreateSchema, customerUpdateSchema } from "./customer.validation";

export const listCustomers = async (req: Request, res: Response) => {
  const { pagination, sort, search } = parseListQueryParams(req, ["id", "name", "email", "status", "country", "createdAt"], ["name", "email", "phone", "company"]);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const country = typeof req.query.country === "string" ? req.query.country : undefined;

  const result = await customerService.listPaginated({ pagination, sort, search, filters: { status, country } });
  
  res.json({
    status: true,
    message: "Customers fetched successfully",
    ...result
  });
};

export const getCustomer = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "customer id");
    const customer = await customerService.get(id);

    if (!customer) {
      return res.status(404).json(toError("Customer not found"));
    }

    res.json(toSuccess("Customer fetched", customer));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  const parsed = customerCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const data = {
    ...parsed.data,
    status: parsed.data.status ?? "Active",
  };

  // Get uploaded profile picture (if any)
  const file = req.file;

  try {
    const created = await customerService.create(data, file);
    res.status(201).json(toSuccess("Customer created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const parsed = customerUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0 && !req.file) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  // Get uploaded profile picture (if any)
  const file = req.file;

  try {
    const id = parseNumericParam(req.params.id, "customer id");
    const updated = await customerService.update(id, updates, file);
    res.json(toSuccess("Customer updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "customer id");
    const removed = await customerService.delete(id);
    res.json(toSuccess("Customer deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};