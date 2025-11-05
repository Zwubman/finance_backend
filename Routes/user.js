import express from "express";
import {
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  changePassword,
} from "../Controllers/user.js";

const router = express.Router();

// collection and static routes first
router.get("/", getAllUsers);

// profile routes for current authenticated user (must come before ":id")
router.get("/profile", getProfile);
router.put("/profile/password", changePassword);
router.put("/profile", updateProfile);

// parameterized routes after static routes
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
