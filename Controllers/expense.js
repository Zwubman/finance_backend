import Expense from "../Models/expense.js";
import BankAccount from "../Models/bank_account.js";
import Project from "../Models/project.js";
import Loan from "../Models/loan.js";
import fs from "fs";

/**
 * Create a new expense
 */
export const createExpense = async (req, res) => {
  try {
    const {
      expense_source,
      specific_source,
      amount,
      description,
      expense_date,
      from_account,
      project_id,
    } = req.body;

    // Validate required fields
    if (
      !expense_source ||
      !amount ||
      !expense_date ||
      !specific_source ||
      !from_account
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }

    const from_acc = await BankAccount.findOne({
      where: { account_id: from_account, is_deleted: false },
    });
    if (!from_acc) {
      return res.status(400).json({
        success: false,
        message: "Source bank account not found",
        data: null,
      });
    }

    if (expense_source === "Project expense" && !project_id) {
      return res.status(400).json({
        success: false,
        message: "project_id is required for Project expense source",
        data: null,
      });
    } else if (project_id) {
      const project = await Project.findOne({
        where: { project_id: project_id, is_deleted: false },
      });
      if (!project) {
        return res.status(400).json({
          success: false,
          message: "Associated project not found",
          data: null,
        });
      }
    }
    let receipt = null;
    if (req.file) {
      receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
        /\\/g,
        "/"
      )}`;
    }

    const newExpense = await Expense.create({
      expense_source,
      specific_source,
      amount,
      description,
      expense_date,
      from_account,
      project_id: project_id || null,
      receipt,
      is_deleted: false,
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: newExpense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Get all expenses
 */
export const getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.received_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      dateFilter.received_date = { [Op.gte]: startDate };
    } else if (endDate) {
      dateFilter.received_date = { [Op.lte]: endDate };
    }

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where: {
        is_deleted: false,
        ...dateFilter,
      },
      include: [
        {
          model: Project,
          as: "for_project",
          attributes: ["project_id", "project_name"],
        },
        {
          model: BankAccount,
          as: "expense_sender",
          attributes: ["account_id", "account_name", "balance"],
        },
        {
          model: Loan,
          as: "for_loan",
          attributes: ["loan_id", "loan_type", "amount"],
        },
      ],
      order: [["expense_date", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (expenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No expenses found",
        data: null,
      });
    }

    const total_expense = await Expense.sum("amount", {
      where: {
        is_deleted: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Expenses retrieved successfully",
      data: expenses,
      total_expense: total_expense || 0,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Get expense by ID
 */
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({
      where: { expense_id: id, is_deleted: false },
      include: [
        {
          model: Project,
          as: "for_project",
          attributes: ["project_id", "project_name"],
        },
        {
          model: BankAccount,
          as: "expense_sender",
          attributes: ["account_id", "account_name", "balance"],
        },
        {
          model: Loan,
          as: "for_loan",
          attributes: ["loan_id", "loan_type", "amount"],
        },
      ],
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense retrieved successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error fetching expense:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Update expense
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      expense_source,
      specific_source,
      amount,
      description,
      expense_date,
      from_account,
      project_id,
    } = req.body;

    const expense = await Expense.findOne({
      where: { expense_id: id, is_deleted: false },
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
        data: null,
      });
    }

    const to_update = {};

    if (req.file && req.file.path) {
      // Delete old local image
      if (expense.receipt) {
        const oldPath = expense.receipt.replace(
          `${req.protocol}://${req.get("host")}/`,
          ""
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Assign new image URL from multer
      expense.receipt = `${req.protocol}://${req.get(
        "host"
      )}/${req.file.path.replace(/\\/g, "/")}`;
      await expense.save();
    }
    if (expense_source) to_update.expense_source = expense_source;
    if (specific_source) to_update.specific_source = specific_source;
    if (amount) to_update.amount = amount;
    if (description) to_update.description = description;
    if (expense_date) to_update.expense_date = expense_date;
    if (from_account) to_update.from_account = from_account;
    if (project_id !== undefined) to_update.project_id = project_id;

    await expense.update(to_update);

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Delete expense record (soft delete)
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      where: { expense_id: id, is_deleted: false },
    });

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    await expense.update({
      is_deleted: true,
      deleted_by: req.user?.id || null,
      deleted_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
