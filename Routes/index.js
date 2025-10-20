import express from "express";
import userRoutes from "./user.js";
import employeeRoutes from "./employee.js";
import projectRoutes from "./project.js";
import loanRoutes from "./loan.js";
import bankAccountRoutes from "./bank_account.js";
import accountTransferRoutes from "./account_transfer.js";
import incomeRoutes from "./income.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/bank-accounts", bankAccountRoutes);
router.use("/account-transfers", accountTransferRoutes);
router.use("/projects", projectRoutes);
router.use("/loans", loanRoutes);
router.use("/incomes", incomeRoutes);

export default router;
