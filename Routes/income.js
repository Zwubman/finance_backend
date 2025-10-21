import express from "express";
import {
  createIncome,
  getAllIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
  getIncomeExpenseSummary,
} from "../Controllers/income.js";
import upload from "../Middlewares/upload.js";

const router = express.Router();

router.post("/", upload.single("receipt"), createIncome);
router.get("/", getAllIncomes);
router.get("/:id", getIncomeById);
router.put("/:id", updateIncome);
router.delete("/:id", deleteIncome);
router.get("/summary", getIncomeExpenseSummary);

export default router;
