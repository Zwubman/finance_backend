import express from "express";
import {
  createReceivable,
  getAllReceivable,
  getReceivableById,
  updateReceivables,
  deleteReceivable,
  updateReceivableStatus,
} from "../Controllers/receivable.js";

const router = express.Router();

router.post("/", createReceivable)
router.get("/", getAllReceivable);
router.get("/:id", getReceivableById);
router.put("/:id", updateReceivables);
router.put("/status/:id", updateReceivableStatus);
router.delete("/:id", deleteReceivable);

export default router;
