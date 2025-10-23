import express from "express";
import {
  createLoan,
  getAllLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  updateLoanStatus,
} from "../Controllers/loan.js";
import upload from "../Middlewares/upload.js";
import { requireRole } from "../Middlewares/auth.js";

const router = express.Router();

router.post("/", upload.single("receipt"), requireRole("Manager"), createLoan);
router.get("/", getAllLoans);
router.get("/:id", getLoanById);
router.put("/:id", upload.single("receipt"), updateLoan);
router.patch("/update-status/:id", updateLoanStatus);
router.delete("/:id", deleteLoan);

export default router;