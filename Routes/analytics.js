import express from "express";
import { getSystemAnalytics } from "../Controllers/analytics.js";

const router = express.Router();

// GET /api/v1/analytics/system
router.get("/system", getSystemAnalytics);

export default router;
