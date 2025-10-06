import express from "express";
import {
  getEmployeeById,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
} from "../Controllers/employee.js";

const router = express.Router();

router.get("/:id", getEmployeeById);
router.get("/", getAllEmployees);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
