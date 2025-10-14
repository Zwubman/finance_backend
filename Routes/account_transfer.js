import express from "express";
import {
  createAccountTransfer,
  getAllAccountTransfers,
  getAccountTransferById,
  updateAccountTransfer,
  deleteAccountTransfer,
} from "../Controllers/account_transfer.js";
import upload from "../Middlewares/upload.js";

const router = express.Router();

router.post("/", upload.single("receipt"), createAccountTransfer);
router.put("/:id", upload.single("receipt"), updateAccountTransfer);
router.get("/", getAllAccountTransfers);
router.get("/:id", getAccountTransferById);
router.delete("/:id", deleteAccountTransfer);

export default router;
