import express from "express";
import {
  createProjectCost,
  getAllProjectCosts,
  getProjectCostByProjectId,
  updateProjectCost,
  deleteProjectCost,
} from "../Controllers/project_cost.js";

const router = express.Router();

router.post("/:id", createProjectCost);
router.get("/", getAllProjectCosts);
router.get("/:id", getProjectCostByProjectId);
router.put("/:id", updateProjectCost);
router.delete("/:id", deleteProjectCost);

export default router;
