import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectCostEntry,
  addEmployeeToProject,
  removeEmployeeFromProject,
} from "../Controllers/project.js";
import upload from "../Middlewares/upload.js";

const router = express.Router();

router.post("/", createProject);
router.get("/", getAllProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/add-cost", upload.single("receipt"), addProjectCostEntry);
router.post("/:id/add-employee", addEmployeeToProject);
router.delete("/:id/remove-employee/:employeeId", removeEmployeeFromProject);

export default router;
