import express from "express";
import {
  createBudgetPlan,
  getAllBudgetPlans,
  getBudgetPlanById,
  updateBudgetPlan,
  deleteBudgetPlan,
} from "../Controllers/budget_plan.js";

const router = express.Router();

router.post("/", createBudgetPlan);
router.get("/", getAllBudgetPlans);
router.get("/:id", getBudgetPlanById);
router.put("/:id", updateBudgetPlan);
router.delete("/:id", deleteBudgetPlan);

export default router;
