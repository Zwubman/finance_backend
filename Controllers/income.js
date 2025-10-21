import Income from "../Models/income.js";
import BankAccount from "../Models/bank_account.js";
import Project from "../Models/project.js";
import Loan from "../Models/loan.js";
import Expense from "../Models/expense.js";
import { Op, or } from "sequelize";
import fs from "fs";

/**
 * Create a new income
 */
export const createIncome = async (req, res) => {
  try {
    const {
      income_source,
      specific_source,
      amount,
      description,
      received_date,
      to_account,
      project_id,
    } = req.body;

    // Validate required fields
    if (
      !income_source ||
      !amount ||
      !received_date ||
      !specific_source ||
      !to_account
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }

    const to_acc = await BankAccount.findOne({
      where: { account_id: to_account, is_deleted: false },
    });
    if (!to_acc) {
      return res.status(400).json({
        success: false,
        message: "Destination bank account not found",
        data: null,
      });
    }

    if (income_source === "Project income" && !project_id) {
      return res.status(400).json({
        success: false,
        message: "project_id is required for Project income source",
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

    // Create the income record
    const newIncome = await Income.create({
      income_source,
      specific_source,
      amount,
      received_date,
      to_account,
      receipt,
      project_id: project_id || null,
      description: description || null,
    });

    to_acc.balance = Number(to_acc.balance) + Number(amount);
    await to_acc.save();

    return res.status(201).json({
      success: true,
      message: "Income record created successfully",
      data: newIncome,
    });
  } catch (error) {
    console.error("Error creating income record:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

/**
 * Get all incomes
 */
export const getAllIncomes = async (req, res) => {
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

    const { count, rows: incomes } = await Income.findAndCountAll({
      where: {
        is_deleted: false,
        ...dateFilter,
      },
      include: [
        { model: BankAccount, as: "receiver" },
        { model: Project, as: "from_project" },
        { model: Loan, as: "from_loan" },
      ],
      order: [["received_date", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total_income = await Income.sum("amount", {
      where: {
        is_deleted: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Incomes retrieved successfully",
      data: incomes,
      total_income: total_income || 0,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving incomes:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

/**
 * Get income by ID
 */
export const getIncomeById = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findOne({
      where: { income_id: id, is_deleted: false },
      include: [
        {
          model: BankAccount,
          as: "receiver",
        },
        {
          model: Project,
          as: "from_project",
        },
        {
          model: Loan,
          as: "from_loan",
        },
      ],
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Income record not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Income record retrieved successfully",
      data: income,
    });
  } catch (error) {
    console.error("Error retrieving income record:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

/**
 * Update income
 */
export const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      income_source,
      specific_source,
      amount,
      description,
      received_date,
      to_account,
      project_id,
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const income = await Income.findOne({
      where: { income_id: id, is_deleted: false },
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Income record not found",
        data: null,
      });
    }

    const to_update = {};

    if (req.file && req.file.path) {
      // Delete old local image
      if (income.receipt) {
        const oldPath = income.receipt.replace(
          `${req.protocol}://${req.get("host")}/`,
          ""
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Assign new image URL from multer
      income.receipt = `${req.protocol}://${req.get(
        "host"
      )}/${req.file.path.replace(/\\/g, "/")}`;
      await income.save();
    }

    if (
      income_source === "project income" &&
      income.project_id === null &&
      !project_id
    ) {
      return res.status(400).json({
        success: false,
        message: "project_id is required for Project income source",
        data: null,
      });
    }

    if (income_source) to_update.income_source = income_source;
    if (specific_source) to_update.specific_source = specific_source;
    if (description) to_update.description = description;
    if (received_date) to_update.received_date = received_date;
    if (project_id) to_update.project_id = project_id;

    if (amount) {
      const account = await BankAccount.findOne({
        where: { account_id: income.to_account, is_deleted: false },
      });
      if (account) {
        account.balance = Number(account.balance) - Number(income.amount);
        await account.save();
      }

      to_update.amount = amount;

      account.balance = Number(account.balance) + Number(amount);
      await account.save();
    }

    if (to_account) {
      const to_acc = await BankAccount.findOne({
        where: { account_id: to_account, is_deleted: false },
      });
      const updated_acc = await BankAccount.findOne({
        where: { account_id: income.to_account, is_deleted: false },
      });
      if (updated_acc) {
        updated_acc.balance =
          Number(updated_acc.balance) - Number(income.amount);
        await updated_acc.save();
      }
      if (!to_acc) {
        return res.status(400).json({
          success: false,
          message: "Destination bank account not found",
          data: null,
        });
      }
      to_update.to_account = to_account;
      to_acc.balance = Number(to_acc.balance) + Number(income.amount);
      await to_acc.save();
    }

    await income.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Income record updated successfully",
      data: income,
    });
  } catch (error) {
    console.error("Error updating income record:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

/**
 * Delete income record (soft delete)
 */
export const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findOne({
      where: { income_id: id, is_deleted: false },
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Income record not found",
        data: null,
      });
    }

    await income.update({
      is_deleted: true,
      deleted_by: req.user?.id || null,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Income record deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting income record:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

/**
 * Get both toal income and total expenses
 */
export const getIncomeExpenseSummary = async (req, res) => {
  try {
    const total_income = await Income.sum("amount", {
      where: { is_deleted: false },
    });

    const total_expense = await Expense.sum("amount", {
      where: { is_deleted: false },
    });

    const active_project = await Project.count({
      where: { is_deleted: false, status: { [Op.ne]: "Completed" } },
    });

    const loan_cost = await Expense.sum("amount", {
      where: {
        is_deleted: false,
        expense_reason: {
          [Op.or]: [
            { [Op.eq]: "Expense for employee loan" },
            { [Op.eq]: "Expense for repaying loan to bank" },
          ],
        },
      },
    });

    const net_profit = Number(total_income || 0) - Number(total_expense || 0);

    return res.status(200).json({
      success: true,
      message: "Income and Expense summary retrieved successfully",
      data: {
        total_income: total_income || 0,
        total_expense: total_expense || 0,
        net_profit: net_profit || 0,
        active_project: active_project || 0,
      },
    });
  } catch (error) {
    console.error("Error retrieving income and expense summary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};
