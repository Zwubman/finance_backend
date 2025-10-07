import express from "express";
import { createProject, getAllProjects, getProjectById, updateProject, deleteProject } from "../Controllers/project.js";

const router = express.Router();

router.post("/", createProject);
router.get("/", getAllProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;