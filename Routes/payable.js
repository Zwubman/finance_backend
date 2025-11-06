import express from "express";
import {
  createPayable,
  getAllPayables,
  getPayableById,
  updatePayable,
  updatePayableStatus,
  deletePayable,
} from "../Controllers/payable.js";

const router = express.Router();

router.post("/", createPayable);
router.get("/", getAllPayables);
router.get("/:id", getPayableById);
router.put("/:id", updatePayable);
router.put("/status/:id", updatePayableStatus);
router.delete("/:id", deletePayable);

export default router;
