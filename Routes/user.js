import express from "express";
import { getUserById, getAllUsers, updateUser, deleteUser } from "../Controllers/user.js";

const router = express.Router();

router.get("/:id", getUserById);
router.get("/", getAllUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;