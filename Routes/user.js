import express from "express";
import { getUserById, getAllUsers, updateUser, deleteUser, getProfile, updateProfile, changePassword } from "../Controllers/user.js";
import { authenticate } from "../Middlewares/auth.js";

const router = express.Router();

// collection and static routes first
router.get("/", getAllUsers);

// profile routes for current authenticated user (must come before ":id")
router.get("/profile", authenticate, getProfile);
router.put("/profile/password", authenticate, changePassword);
router.put("/profile", authenticate, updateProfile);

// parameterized routes after static routes
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;