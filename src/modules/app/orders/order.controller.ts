import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";

import { orderService } from "./order.service";
import { orderCreateSchema, orderUpdateSchema } from "./order.validation";

const toDate = (value?: string) => (value ? new Date(value) : new Date());

export const listOrders = async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const orders = await orderService.list(status);
  res.json(toSuccess("Orders fetched", orders));
};

export const getOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await orderService.get(id);
  if (!order) {
    return res.status(404).json(toError("Order not found"));
  }
  res.json(toSuccess("Order fetched", order));
};

export const createOrder = async (req: Request, res: Response) => {
  const parsed = orderCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const payload: any = {
    ...parsed.data,
    date: toDate(parsed.data.date),
  };

  if (!payload.id) {
    delete payload.id;
  }

  try {
    const created = await orderService.create(payload);
    res.status(201).json(toSuccess("Order created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  const parsed = orderUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  const updatePayload: any = { ...updates };
  if (updates.date) {
    updatePayload.date = toDate(updates.date);
  }

  try {
    const updated = await orderService.update(req.params.id, updatePayload);
    res.json(toSuccess("Order updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const removed = await orderService.delete(req.params.id);
    res.json(toSuccess("Order deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
