import { Router } from "express";
import { randomUUID } from "crypto";
import { toSuccess } from "@/core/utils/httpResponse";

export const exampleRouter = Router();

exampleRouter.get("/examples", (_req, res) => {
  res.json(toSuccess("Sample data", [{ id: 1, name: "Starter Item" }]));
});

exampleRouter.post("/examples", (req, res) => {
  res.status(201).json(
    toSuccess("Resource created", {
      ...req.body,
      id: randomUUID(),
    })
  );
});