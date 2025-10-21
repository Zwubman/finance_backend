import User from "../Models/user.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      password,
      password_confirmation,
      phone_number,
      role,
    } = req.body;

    // validation
    if (
      !first_name ||
      !middle_name ||
      !last_name ||
      !email ||
      !password ||
      !password_confirmation ||
      !phone_number ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    if (password !== password_confirmation) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
        data: null,
      });
    }

    if (phone_number && !/^\+?[1-9]\d{1,14}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
        data: null,
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        data: null,
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone_number }],
        is_deleted: false,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or phone number already exists",
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      middle_name,
      last_name,
      email,
      phone_number,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { user_id: id, is_deleted: false },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const {page = 1, limit = 10} = req.query;
    const offset = (page - 1) * limit;

    const {count, rows: users} = await User.findAndCountAll({
      where: { is_deleted: false },
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, middle_name, last_name, email, phone_number } =
      req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const user = await User.findOne({
      where: {
        user_id: id,
        is_deleted: false,
      },
    });

    const to_update = {};

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          data: null,
        });
      }
      to_update.email = email;
    }

    if (phone_number) {
      if (!/^\+?[1-9]\d{1,14}$/.test(phone_number)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format",
          data: null,
        });
      }
      to_update.phone_number = phone_number;
    }

    if (first_name) to_update.first_name = first_name;
    if (middle_name) to_update.middle_name = middle_name;
    if (last_name) to_update.last_name = last_name;

    await user.update(to_update);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: to_update,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: {
        user_id: id,
        is_deleted: false,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    await user.update({ is_deleted: true, deleted_at: new Date() });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};
