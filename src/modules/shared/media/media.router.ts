/**
 * Media Router
 * Defines routes for media operations
 */

import { Router } from "express";
import { mediaController } from "./media.controller";
import { uploadSingle, uploadMultiple } from "@/core/middlewares/upload";

const router = Router();

/**
 * @route POST /api/admin/media/single
 * @route POST /api/app/media/single
 * @desc Upload a single media file
 * @access Private (Admin or App User)
 */
router.post("/single", uploadSingle("file"), mediaController.uploadSingle);

/**
 * @route POST /api/admin/media/multiple
 * @route POST /api/app/media/multiple
 * @desc Upload multiple media files
 * @access Private (Admin or App User)
 */
router.post("/multiple", uploadMultiple("files", 10), mediaController.uploadMultiple);

/**
 * @route GET /api/admin/media
 * @route GET /api/app/media
 * @desc Get media with filters
 * @access Private (Admin or App User)
 */
router.get("/", mediaController.getMedia);

/**
 * @route GET /api/admin/media/stats
 * @desc Get storage statistics
 * @access Private (Admin only - should be protected in routes)
 */
router.get("/stats", mediaController.getStorageStats);

/**
 * @route GET /api/admin/media/:id
 * @route GET /api/app/media/:id
 * @desc Get media by ID
 * @access Private (Admin or App User)
 */
router.get("/:id(\\d+)", mediaController.getMediaById);

/**
 * @route GET /api/admin/media/uuid/:uuid
 * @route GET /api/app/media/uuid/:uuid
 * @desc Get media by UUID
 * @access Private (Admin or App User)
 */
router.get("/uuid/:uuid", mediaController.getMediaByUuid);

/**
 * @route GET /api/admin/media/model/:modelType/:modelId
 * @route GET /api/app/media/model/:modelType/:modelId
 * @desc Get media by model (polymorphic relation)
 * @access Private (Admin or App User)
 */
router.get("/model/:modelType/:modelId", mediaController.getMediaByModel);

/**
 * @route DELETE /api/admin/media/:id
 * @route DELETE /api/app/media/:id
 * @desc Delete media permanently
 * @access Private (Admin or App User)
 */
router.delete("/:id", mediaController.deleteMedia);

/**
 * @route POST /api/admin/media/delete-multiple
 * @route POST /api/app/media/delete-multiple
 * @desc Delete multiple media
 * @access Private (Admin or App User)
 */
router.post("/delete-multiple", mediaController.deleteMultipleMedia);

/**
 * @route PATCH /api/admin/media/:id/custom-properties
 * @route PATCH /api/app/media/:id/custom-properties
 * @desc Update custom properties
 * @access Private (Admin or App User)
 */
router.patch("/:id/custom-properties", mediaController.updateCustomProperties);

/**
 * @route PATCH /api/admin/media/:id/manipulations
 * @route PATCH /api/app/media/:id/manipulations
 * @desc Update manipulations
 * @access Private (Admin or App User)
 */
router.patch("/:id/manipulations", mediaController.updateManipulations);

/**
 * @route PATCH /api/admin/media/:id/order
 * @route PATCH /api/app/media/:id/order
 * @desc Update order column
 * @access Private (Admin or App User)
 */
router.patch("/:id/order", mediaController.updateOrder);

/**
 * @route POST /api/admin/media/reorder/:modelType/:modelId/:collectionName
 * @route POST /api/app/media/reorder/:modelType/:modelId/:collectionName
 * @desc Reorder media in a collection
 * @access Private (Admin or App User)
 */
router.post("/reorder/:modelType/:modelId/:collectionName", mediaController.reorderMedia);

/**
 * @route POST /api/admin/media/attach
 * @route POST /api/app/media/attach
 * @desc Attach media to a model (create DB entry)
 * @access Private (Admin or App User)
 */
router.post("/attach", mediaController.attachMedia);

/**
 * @route POST /api/admin/media/attach-multiple
 * @route POST /api/app/media/attach-multiple
 * @desc Attach multiple media to a model
 * @access Private (Admin or App User)
 */
router.post("/attach-multiple", mediaController.attachMultipleMedia);

/**
 * @route POST /api/admin/media/link
 * @route POST /api/app/media/link
 * @desc Link media to a model (update existing media records)
 * @access Private (Admin or App User)
 */
router.post("/link", mediaController.linkMediaToModel);

/**
 * @route POST /api/admin/media/:id/detach
 * @route POST /api/app/media/:id/detach
 * @desc Detach media from model
 * @access Private (Admin or App User)
 */
router.post("/:id/detach", mediaController.detachMedia);

export default router;

