import express from "express";
import {createAsset, getAssetById, getAllAssets, updateAsset, deleteAsset, updateAssetPaymentStatus} from "../Controllers/asset.js";

const router = express.Router();

router.post("/", createAsset);
router.get("/", getAllAssets);
router.get("/:id", getAssetById);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);
// Endpoint to update payment status (e.g., Approved, Rejected, Paid).
router.patch("/:id/payment-status", updateAssetPaymentStatus);

export default router;
