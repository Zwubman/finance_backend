import express from "express";
import userRoutes from "./user.js";
import employeeRoutes from "./employee.js";
import projectRoutes from "./project.js";
import loanRoutes from "./loan.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/projects", projectRoutes);
router.use("/loans", loanRoutes);

export default router;
