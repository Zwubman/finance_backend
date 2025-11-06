import express from "express";
import { authenticate, requireRole } from "../Middlewares/auth.js";
import upload from "../Middlewares/upload.js";
import {
  createPayroll,
  getPayrollById,
  getAllPayrolls,
  payPayroll,
  deletePayroll,
} from "../Controllers/payroll.js";

const router = express.Router();

// Only managers or accountants can create payrolls
// allow attaching a recipient file (payslip/receipt) using field name 'recipient_file'
router.post("/", authenticate, requireRole("Manager", "Accountant"), upload.single("recipient_file"), createPayroll);

// List and get
router.get("/", authenticate, requireRole("Manager", "Accountant"), getAllPayrolls);
router.get("/:id", authenticate, requireRole("Manager", "Accountant"), getPayrollById);

// Mark payroll as paid (Cashier may also mark as paid depending on permissions)
router.put("/:id/pay", authenticate, requireRole("Manager", "Accountant", "Cashier"), payPayroll);

router.delete("/:id", authenticate, requireRole("Manager", "Accountant"), deletePayroll);

export default router;
