import { Router } from "express";

import {
  createRbacAssignment,
  createRbacModule,
  createRbacPermission,
  createRbacRole,
  deleteRbacAssignment,
  deleteRbacModule,
  deleteRbacPermission,
  deleteRbacRole,
  getRbacAssignment,
  getRbacModule,
  getRbacPermission,
  getRbacRole,
  getRbacSnapshot,
  listRbacAssignments,
  listRbacModules,
  listRbacPermissions,
  listRbacRoles,
  updateRbacAssignment,
  updateRbacModule,
  updateRbacPermission,
  updateRbacRole,
} from "./rbac.controller";

export const rbacRouter = Router();

rbacRouter.get("/", getRbacSnapshot);

rbacRouter.get("/modules", listRbacModules);
rbacRouter.post("/modules", createRbacModule);
rbacRouter.get("/modules/:id", getRbacModule);
rbacRouter.put("/modules/:id", updateRbacModule);
rbacRouter.delete("/modules/:id", deleteRbacModule);

rbacRouter.get("/permissions", listRbacPermissions);
rbacRouter.post("/permissions", createRbacPermission);
rbacRouter.get("/permissions/:id", getRbacPermission);
rbacRouter.put("/permissions/:id", updateRbacPermission);
rbacRouter.delete("/permissions/:id", deleteRbacPermission);

rbacRouter.get("/roles", listRbacRoles);
rbacRouter.post("/roles", createRbacRole);
rbacRouter.get("/roles/:id", getRbacRole);
rbacRouter.put("/roles/:id", updateRbacRole);
rbacRouter.delete("/roles/:id", deleteRbacRole);

rbacRouter.get("/assignments", listRbacAssignments);
rbacRouter.post("/assignments", createRbacAssignment);
rbacRouter.get("/assignments/:id", getRbacAssignment);
rbacRouter.put("/assignments/:id", updateRbacAssignment);
rbacRouter.delete("/assignments/:id", deleteRbacAssignment);