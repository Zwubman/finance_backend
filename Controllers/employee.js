import Employee from "../Models/employee.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";

export const registerEmployee = async (req, res) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      gender,
      email,
      password,
      password_confirmation,
      phone_number,
      department,
      position,
      salary,
      hired_date,
    } = req.body;

    // validation
    if (
      !first_name ||
      !middle_name ||
      !last_name ||
      !gender ||
      !email ||
      !password ||
      !password_confirmation ||
      !phone_number ||
      !department ||
      !position ||
      !salary ||
      !hired_date
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender",
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

    const existingEmployee = await Employee.findOne({
      where: {
        [Op.or]: [{ email }, { phone_number }],
        is_deleted: false,
      },
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email or phone number already exists",
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await Employee.create({
      first_name,
      middle_name,
      last_name,
      gender,
      email,
      phone_number,
      password: hashedPassword,
      department,
      position,
      salary,
      hired_date,
    });

    return res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Error in register employee:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({
      where: { employee_id: id, is_deleted: false },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Error in get employee by id:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({ where: { is_deleted: false } });

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employees found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Error in get all employees:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      middle_name,
      last_name,
      email,
      phone_number,
      gender,
      department,
      position,
      salary,
      hired_date,
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const employee = await Employee.findOne({
      where: {
        employee_id: id,
        is_deleted: false,
      },
    });

    const to_update = {};

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
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

    if (gender) {
      if (!["Male", "Female", "Other"].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender",
          data: null,
        });
      }
      to_update.gender = gender;
    }

    if (first_name) to_update.first_name = first_name;
    if (middle_name) to_update.middle_name = middle_name;
    if (last_name) to_update.last_name = last_name;
    if( department) to_update.department = department;
    if( position) to_update.position = position;
    if( salary) to_update.salary = salary;
    if( hired_date) to_update.hired_date = hired_date;

    await employee.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
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

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findOne({
      where: {
        employee_id: id,
        is_deleted: false,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });
    }

    await employee.update({ is_deleted: true, deleted_at: new Date() });

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
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