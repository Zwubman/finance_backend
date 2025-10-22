import express from "express";
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  updateExpenseStatus,
} from "../Controllers/expense.js";
import { requireRole } from "../Middlewares/auth.js";
import upload from "../Middlewares/upload.js";

const router = express.Router();

router.post("/", requireRole("Manager"), createExpense);
router.put(
  "/:id/status",
  requireRole("Accountant", "Cashier"),
  upload.single("receipt"),
  updateExpenseStatus
);
router.get("/", getAllExpenses);
router.get("/:id", getExpenseById);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
