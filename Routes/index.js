import express from "express";
import userRoutes from "./user.js";
import employeeRoutes from "./employee.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);

export default router;