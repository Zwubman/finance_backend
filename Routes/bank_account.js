import express from "express";
import {
  createBankAccount,
  getAllBankAccounts,
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
} from "../Controllers/bank_account.js";
const router = express.Router();

router.post("/", createBankAccount);
router.get("/", getAllBankAccounts);
router.get("/:id", getBankAccountById);
router.put("/:id", updateBankAccount);
router.delete("/:id", deleteBankAccount);

export default router;
