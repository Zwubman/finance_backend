import express from "express";
import {
  createProjectCost,
  getAllProjectCosts,
  getProjectCostByProjectId,
  updateProjectCost,
  deleteProjectCost,
  getProjectCostById,
} from "../Controllers/project_cost.js";

const router = express.Router();

router.post("/", createProjectCost);
router.get("/", getAllProjectCosts);
router.get("/:id", getProjectCostByProjectId);
router.get("/detail/:id", getProjectCostById);
router.put("/:id", updateProjectCost);
router.delete("/:id", deleteProjectCost);

export default router;
