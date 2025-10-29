import express from "express";
import { getReport } from "../Controllers/report.js";

const router = express.Router();

router.get("/", getReport);

export default router;