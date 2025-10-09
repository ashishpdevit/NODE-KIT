// src/modules/shared/routes/upload.routes.ts
import { Router } from "express";
import multer from "multer";
import { UploadController } from "./upload.controller";

export const uploadRouter = Router();
const upload = multer(); // memory storage

uploadRouter.post("/single", upload.single("file"), UploadController.single);
uploadRouter.post("/multiple", upload.array("files"), UploadController.multiple);

// export default uploadRouter;
