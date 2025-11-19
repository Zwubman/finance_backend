import Payroll from "../Models/payroll.js";
import Employee from "../Models/employee.js";
import Project from "../Models/project.js";
import ExpenseRequest from "../Models/expense_request.js";
import Expense from "../Models/expense.js";
import BankAccount from "../Models/bank_account.js";
import { Op } from "sequelize";
import { Sequelize } from "sequelize";
import sequelize from "../Config/database.js";

export const createPayroll = async (req, res) => {
  try {
    const { employee_id, period, deduction, overtime } = req.body;

    // Validation
    const required_fields = ["employee_id", "period"];
    const missingFields = required_fields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingFields.join(", ")}`,
        data: null,
      });
    }

    // Fetch employee
    const employee = await Employee.findOne({
      where: {
        employee_id,
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

    // Check project assignment logic
    const assignedProjects = await Project.findAll({
      where: {
        is_deleted: false,
        assigned_to: {
          [Sequelize.Op.contains]: [employee_id],
        },
      },
    });

    if (assignedProjects.length === 0) {
      console.log("Employee not assigned to any project — payroll allowed.");
    } else {
      const hasIncompleteProject = assignedProjects.some(
        (project) => project.status !== "Completed"
      );

      if (hasIncompleteProject) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot create payroll — employee is assigned to a project that is not completed.",
          data: null,
        });
      }
    }

    const expense_request = await ExpenseRequest.findAll({
      where: {
        employee_id,
        is_deleted: false,
        status: "Approved",
      },
    });

    const allowances = expense_request.reduce(
      (total, request) => total + request.total_amount,
      0
    );

    const net_pay =
      Number(employee.salary) +
      Number(allowances) +
      Number(overtime || 0) -
      Number(deduction || 0);


    // use a transaction so payroll and associated expense are created atomically
    const t = await sequelize.transaction();
    try {
      const payroll = await Payroll.create(
        {
          employee_id,
          period,
          deduction,
          overtime,
        },
        { transaction: t }
      );

      // find a source bank account (Vault) to attach to the expense
      const from_acc = await BankAccount.findOne({ where: { account_name: "Vault", is_deleted: false } });
      if (!from_acc) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Source bank account 'Vault' not found. Create a bank account named 'Vault' before creating payroll.", data: null });
      }

      await Expense.create(
        {
          expense_reason: "Employee salary costs",
          specific_reason: `Pay salary for employee: ${employee.first_name} ${employee.middle_name} `,
          amount: net_pay,
          from_account: from_acc.account_id,
          status: "Requested",
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({
        success: true,
        message: "Payroll created successfully.",
        data: {
          payroll,
          net_pay,
        },
      });
      return;
    } catch (err) {
      await t.rollback();
      console.error("Error creating payroll (transaction):", err);
      return res.status(500).json({ success: false, message: "Server Error", data: null });
    }

    res.status(201).json({
      success: true,
      message: "Payroll created successfully.",
      data: {
        payroll,
        net_pay,
      },
    });
  } catch (error) {
    console.error("Error creating payroll:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAllPayrolls = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { is_deleted: false };

    const { count, rows: payrolls } = await Payroll.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      message: "Payroll retrieved successfully",
      data: payrolls,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in get all payrolls:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getPayrollById = async(req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findOne({
      where: { payroll_id: id, is_deleted: false },
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "payroll record not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "payroll record retrieved successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("Error retrieving payroll record:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

export const deletePayroll = async(req, res) => {
    try {
    const { id } = req.params;
    const payroll = await Payroll.findOne({
      where: { payroll_id: id, is_deleted: false },
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
        data: null,
      });
    }

    await payroll.update({
      is_deleted: true,
      deleted_by: req.user?.id || null,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Payroll record deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting payroll record:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
}
