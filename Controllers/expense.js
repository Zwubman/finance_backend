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
    const { expense_reason, specific_reason, amount, description, project_id } =
      req.body;

    // Validate required fields
    if (!expense_reason || !amount || !specific_reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }

    const from_acc = await BankAccount.findOne({
      where: { account_name: "Vault", is_deleted: false },
    });
    if (!from_acc) {
      return res.status(400).json({
        success: false,
        message: "Source bank account not found",
        data: null,
      });
    }

    if (expense_reason === "Project expense" && !project_id) {
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
    // let receipt = null;
    // if (req.file) {
    //   receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
    //     /\\/g,
    //     "/"
    //   )}`;
    // } else {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Receipt is required for the expense",
    //     data: null,
    //   });
    // }

    const new_expense = await Expense.create({
      expense_reason,
      specific_reason,
      amount,
      description,
      project_id: project_id || null,
    });

    // if (new_expense) {
    //   // Deduct amount from bank account balance with transfer fee
    //   from_acc.balance =
    //     Number(from_acc.balance) - Number(amount + amount * 0.02);
    //   await from_acc.save();
    // }

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: new_expense,
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

    const role = req.user.role;

    const condition = {};
    if (role === "Accountant") {
      condition.status = ["Requested", "Approved", "Rejected"];
    } else if (role === "Cashier") {
      condition.status = ["Approved", "Paid"];
    }

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
        ...condition,
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
          attributes: ["account_id", "account_name"],
        },
        {
          model: Loan,
          as: "for_loan",
          attributes: ["loan_id", "amount"],
        },
      ],
      order: [["expensed_date", "DESC"]],
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
          attributes: ["account_id", "account_name"],
        },
        {
          model: Loan,
          as: "for_loan",
          attributes: ["loan_id", "amount"],
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
      expense_reason,
      specific_reason,
      amount,
      description,
      expensed_date,
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
    if (expense_reason) to_update.expense_reason = expense_reason;
    if (specific_reason) to_update.specific_reason = specific_reason;
    if (amount) to_update.amount = amount;
    if (description) to_update.description = description;
    if (expensed_date) to_update.expensed_date = expensed_date;
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

/**
 * Approve expense
 */
export const updateExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected", "Paid"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        data: null,
      });
    }

    if (
      req.user.role === "Accountant" &&
      !["Approved", "Rejected"].includes(status)
    ) {
      return res.status(403).json({
        success: false,
        message: "Accountant can only approve or reject expenses",
        data: null,
      });
    }

    if (req.user.role === "Cashier" && status !== "Paid") {
      return res.status(403).json({
        success: false,
        message: "Cashier can only mark expenses as paid",
        data: null,
      });
    }

    const from_acc = await BankAccount.findOne({
      where: { account_name: "Peal", is_deleted: false },
    });
    if (!from_acc) {
      return res.status(400).json({
        success: false,
        message: "Source bank account not found",
        data: null,
      });
    }

    if (from_acc.balance < expense.amount && status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in the bank account to pay the expense",
        data: null,
      });
    }

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

    if (status === "Paid" && expense.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved expenses can be marked as paid",
        data: null,
      });
    }

    let receipt = null;
    if (status === "Paid") {
      if (req.file) {
        receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
          /\\/g,
          "/"
        )}`;
      } else {
        return res.status(400).json({
          success: false,
          message: "Receipt is required for the expense",
          data: null,
        });
      }
    }

    
    let from_account = null;
    if(status === "Paid"){
      from_account = from_acc.account_id;
    }

    await expense.update({
      status,
      receipt,
      from_account,
    });

    if (expense.status === "Paid") {
      // Deduct amount from bank account balance with transfer fee
      from_acc.balance =
        Number(from_acc.balance) - Number(amount + amount * 0.02);
      await from_acc.save();

      expense.expensed_date = new Date();
      await expense.save();
    }

    res.status(200).json({
      success: true,
      message: `Expense ${status.toLowerCase()} successfully`,
      data: expense,
    });
  } catch (error) {
    console.error("Error approving expense:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
