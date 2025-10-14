import express from "express";
import {
  createLoan,
  getAllLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  updateLoanStatus,
} from "../Controllers/loan.js";

const router = express.Router();

router.post("/", createLoan);
router.get("/", getAllLoans);
router.get("/:id", getLoanById);
router.put("/:id", updateLoan);
router.patch("/update-status/:id", updateLoanStatus);
router.delete("/:id", deleteLoan);

export default router;