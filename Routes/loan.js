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

router.post("/", upload.fields([{ name: "file" }, { name: "receipt" }]), createLoan);
router.get("/", getAllLoans);
router.get("/:id", getLoanById);
router.put("/:id", upload.fields([{ name: "file" }, { name: "receipt" }]), updateLoan);
router.put("/update-status/:id", upload.single("receipt"), updateLoanStatus);
router.delete("/:id", deleteLoan);

export default router;