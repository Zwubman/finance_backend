import express from "express";
import {
  createExpenseRequest,
  getAllExpenseRequests,
  getExpenseRequestById,
  deleteExpenseRequest,
  updateExpenseRequest,
} from "../Controllers/expense_request.js";

const router = express.Router();

router.post("/", createExpenseRequest);
router.get("/", getAllExpenseRequests);
router.get("/:id", getExpenseRequestById);
router.put("/:id", updateExpenseRequest);
router.delete("/:id", deleteExpenseRequest);

export default router;
