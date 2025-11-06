import express from "express";
import {
  createPayroll,
  getAllPayrolls,
  getPayrollById,
  deletePayroll,
} from "../Controllers/payroll.js";

const router = express.Router();

router.post("/", createPayroll);
router.get("/", getAllPayrolls);
router.get("/:id", getPayrollById);
router.delete("/:id", deletePayroll);

export default router;
