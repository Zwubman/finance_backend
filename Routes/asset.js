import express from "express";
import {createAsset, getAssetById, getAllAssets, updateAsset, deleteAsset} from "../Controllers/asset.js";

const router = express.Router();

router.post("/", createAsset);
router.get("/", getAllAssets);
router.get("/:id", getAssetById);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);

export default router;
