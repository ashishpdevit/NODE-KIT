// src/modules/shared/controllers/UploadController.ts
import { Request, Response } from "express";
import { UploadService } from "@/core/services/uploads/UploadService";

const uploadService = new UploadService();

export class UploadController {
    static async single(req: Request, res: Response) {
        const file = req.file;
        const isPrivate = req.body.private == "true"; // client can specify

        if (!file) return res.status(400).json({ message: "No file uploaded" });
        const data = await uploadService.upload(file);
        return res.json({ status: true, data, message: "File uploaded successfully" });
    }

    static async multiple(req: Request, res: Response) {
        const files = req.files as Express.Multer.File[];
        if (!files?.length)
            return res.status(400).json({ message: "No files uploaded" });
        const data = await uploadService.uploadMultiple(files);
        return res.json({ status: true, data, message: "Files uploaded successfully" });
    }
}
