import express from "express";
import {
	createAsset,
	getAssetById,
	getAllAssets,
	updateAsset,
	deleteAsset,
	updateAssetStatus,
} from "../Controllers/asset.js";
import { requireRole } from "../Middlewares/auth.js";

const router = express.Router();

router.post("/", createAsset);
router.get("/", getAllAssets);
router.get("/:id", getAssetById);
router.put("/:id", updateAsset);
// Change asset lifecycle status (Manager only)
router.put("/:id/status", requireRole("Manager"), updateAssetStatus);
router.delete("/:id", deleteAsset);

export default router;
