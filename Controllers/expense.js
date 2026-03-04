import Expense from "../Models/expense.js";
import BankAccount from "../Models/bank_account.js";
import Project from "../Models/project.js";
import Loan from "../Models/loan.js";
import fs from "fs";
import { notifyRoles } from "../Utils/notifications.js";
import {Op} from "sequelize";

/**
 * Create a new expense
 */
export const createExpense = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    // Protect against a missing body (e.g. missing body parser or wrong Content-Type)
    if (!req.body) {
      console.error(
        "Request body is undefined. Ensure body-parsing middleware (express.json()/express.urlencoded() or multer) is configured on the server and the client sends the correct Content-Type."
      );
      return res.status(400).json({
        success: false,
        message:
          "Request body is missing. Ensure the request includes a body and the server has body-parsing middleware enabled.",
        data: null,
      });
    }

    const { expense_reason, specific_reason, amount, description, project_id, from_account } =
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
      where: { account_id: from_account, is_deleted: false },
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
    // Attach receipt URL when a file was uploaded (optional)
    let file = null;
    if (req.file && req.file.path) {
      file = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
    }

    // Ensure numeric amount and include the source account (from_account)
    const numericAmount = Number(amount);
    const new_expense = await Expense.create({
      expense_reason,
      specific_reason,
      amount: numericAmount,
      description,
      file,
      project_id: project_id || null,
      from_account: from_acc.account_id,
    });

    // If created, deduct amount from the source bank account
    if (new_expense) {
      from_acc.balance =
        Number(from_acc.balance) - Number(numericAmount);
      await from_acc.save();
      try {
        const actorName =
          (req.user && (req.user.first_name || req.user.name))
            ? `${req.user.first_name || req.user.name} ${req.user.last_name || ''}`.trim()
            : req.user?.email || `user:${req.user?.id || req.user?.user_id || 'unknown'}`;
        notifyRoles(["Accountant"], {
          title: "New expense created",
          message: `${actorName} created expense '${new_expense.description || new_expense.specific_reason}' (status: ${new_expense.status})`,
          expense_id: new_expense.expense_id,
          status: new_expense.status,
          actor: { id: req.user?.id || req.user?.user_id || null, name: actorName },
        });
      } catch (e) {
        console.error("Failed to send creation notification:", e);
      }
    }

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: new_expense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res
      .status(400)
      .json({ success: false, message: error.message });
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
  condition.status = {
    [Op.in]: ["Requested", "Approved", "Rejected", "Paid"],
  };
} else if (role === "Cashier") {
  condition.status = {
    [Op.in]: ["Approved", "Paid"],
  };
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
        status: "Paid",
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
      .status(400)
      .json({ success: false, message: error.message });
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
      .status(400)
      .json({ success: false, message: error.message });
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
      .status(400)
      .json({ success: false, message: error.message });
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
      .status(400)
      .json({ success: false, message: error.message });
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

    // Fetch expense first
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

    const from_acc = await BankAccount.findOne({
      where: { account_id: expense.from_account, is_deleted: false },
    });
    if (!from_acc) {
      return res.status(400).json({
        success: false,
        message: "Source bank account not found",
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

    if(status === "Approved"){
      if(from_acc.balance <= expense.amount){
        return res.status(400).json({
          success: false,
          message: "Insufficient balance in source account to approve this expense",
          data: null,
        });
      }
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
    if (status === "Paid") {
      from_account = from_acc.account_id;
    }

    // Build update payload but only include fields that are set.
    // This prevents writing null into non-nullable DB columns like `from_account`.
    const toUpdate = { status };
    if (receipt) toUpdate.receipt = receipt;
    if (from_account !== null) toUpdate.from_account = from_account;

    if (status === "Paid") {
      const sequelize = Expense.sequelize;
      await sequelize.transaction(async (t) => {
        await expense.update(toUpdate, { transaction: t });

        // Deduct amount from bank account balance
        const expenseAmount = Number(expense.amount || 0);
        from_acc.balance = Number(from_acc.balance) - expenseAmount;
        await from_acc.save({ transaction: t });

        expense.expensed_date = new Date();
        await expense.save({ transaction: t });

        // If this expense represents an employee loan disbursement, only mark
        // the loan as Given after the expense is successfully paid.
        if (
          expense.loan_id &&
          expense.expense_reason === "Expense for employee loan"
        ) {
          const loan = await Loan.findOne({
            where: { loan_id: expense.loan_id, is_deleted: false },
            transaction: t,
          });

          if (!loan) {
            throw new Error("Linked loan not found for this expense");
          }

          if (loan.status === "Give_Request") {
            await loan.update(
              { status: "Given", receipt: receipt || loan.receipt || null },
              { transaction: t }
            );
          }
        }
      });
    } else {
      await expense.update(toUpdate);
    }

    // send notifications based on new status
    try {
      const actorName =
        (req.user && (req.user.first_name || req.user.name))
          ? `${req.user.first_name || req.user.name} ${req.user.last_name || ''}`.trim()
          : req.user?.email || `user:${req.user?.id || req.user?.user_id || 'unknown'}`;

      if (status === "Rejected") {
        notifyRoles(["Manager"], {
          title: "Expense rejected",
          message: `${actorName} rejected expense '${expense.description || expense.specific_reason}'`,
          expense_id: expense.expense_id,
          status,
          actor: { id: req.user?.id || req.user?.user_id || null, name: actorName },
        });
      } else if (status === "Approved") {
        notifyRoles(["Manager", "Cashier"], {
          title: "Expense approved",
          message: `${actorName} approved expense '${expense.description || expense.specific_reason}'`,
          expense_id: expense.expense_id,
          status,
          actor: { id: req.user?.id || req.user?.user_id || null, name: actorName },
        });
      } else if (status === "Paid") {
        notifyRoles(["Manager", "Accountant"], {
          title: "Expense paid",
          message: `${actorName} marked expense '${expense.description || expense.specific_reason}' as paid`,
          expense_id: expense.expense_id,
          status,
          actor: { id: req.user?.id || req.user?.user_id || null, name: actorName },
        });
      }
    } catch (e) {
      console.error("Failed to send status notification:", e);
    }

    res.status(200).json({
      success: true,
      message: `Expense ${status.toLowerCase()} successfully`,
      data: expense,
    });
  } catch (error) {
    console.error("Error approving expense:", error);
    res
      .status(400)
      .json({ success: false, message: error.message });
  }
};
