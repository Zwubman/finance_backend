import express from "express";
import {
  createProjectCost,
  getAllProjectCosts,
  getProjectCostByProjectId,
  updateProjectCost,
  deleteProjectCost,
  getProjectCostById,
} from "../Controllers/project_cost.js";
import upload from "../Middlewares/upload.js";

const router = express.Router();

router.post("/", upload.single("receipt"), createProjectCost);
router.put("/:id", upload.single("receipt"), updateProjectCost);
router.get("/", getAllProjectCosts);
router.get("/:id", getProjectCostByProjectId);
router.get("/detail/:id", getProjectCostById);
router.delete("/:id", deleteProjectCost);

export default router;
