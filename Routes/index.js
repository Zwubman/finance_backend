import express from "express";
import userRoutes from "./user.js";
import employeeRoutes from "./employee.js";
import projectRoutes from "./project.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/projects", projectRoutes);

export default router;