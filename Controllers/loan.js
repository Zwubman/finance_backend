import Loan from "../Models/loan.js";
import Expense from "../Models/expense.js";
import Income from "../Models/income.js";
import Employee from "../Models/employee.js";
import BankAccount from "../Models/bank_account.js";
import fs from "fs";

/**
 * Create a new loan
 */
export const createLoan = async (req, res) => {
  try {
    const {
      to_who,
      from_whom,
      amount,
      interest_rate,
      start_date,
      end_date,
      purpose,
      penalty,
      status,
      to_account,
    } = req.body;

    // validation
    if (
      !amount ||
      !interest_rate ||
      !start_date ||
      !end_date ||
      !purpose ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    const allowedStatuses = ["Give_Request", "Received"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    if (to_who) {
      const employee = await Employee.findOne({
        where: { employee_id: to_who, is_deleted: false },
      });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
          data: null,
        });
      }
    }

    if (from_whom && !to_account) {
      return res.status(400).json({
        success: false,
        message:
          "to_account is required when loan is received from external source",
        data: null,
      });
    }

    if (to_account) {
      const bank_account = await BankAccount.findOne({
        where: { account_id: to_account, is_deleted: false },
      });

      if (!bank_account) {
        return res.status(404).json({
          success: false,
          message: "Bank account not found",
          data: null,
        });
      }
    }

    if (status === "Received" && !from_whom) {
      return res.status(400).json({
        success: false,
        message: "from_whom is required when status is Received",
        data: null,
      });
    }

    let receipt = null;
    if (status === "Received" && to_who) {
      if (req.file) {
        receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
          /\\/g,
          "/"
        )}`;
      }
    }

    const loan = await Loan.create({
      to_who,
      from_whom,
      receipt,
      amount,
      interest_rate,
      start_date,
      end_date,
      purpose,
      penalty,
      status,
    });

    if (status === "Received") {
      const income = await Income.create({
        income_source: "Income from loans",
        specific_source: `Loan received from ${from_whom}`,
        amount: amount,
        received_date: loan.createdAt,
        to_account: to_account,
        loan_id: loan.loan_id,
        receipt: receipt,
      });
      const to_acc = await BankAccount.findOne({
        where: { account_id: to_account, is_deleted: false },
      });

      to_acc.balance = Number(to_acc.balance) + Number(amount);
      await to_acc.save();
    }
    return res.status(201).json({
      success: true,
      message: "Loan created successfully with appropriate transactions",
      data: loan,
    });
  } catch (error) {
    console.error("Error in create loan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

/**
 * Get loan by ID
 */
export const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findOne({
      where: { loan_id: id, is_deleted: false },
      include: [
        {
          model: Employee,
          as: "borrower",
          attributes: [
            "first_name",
            "middle_name",
            "last_name",
            "email",
            "phone_number",
          ],
        },
      ],
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loan retrieved successfully",
      data: loan,
    });
  } catch (error) {
    console.error("Error in get loan by id:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

/**
 * Get all loans with pagination
 * Accountants see only Give_Request and Return_Request
 * Cashiers see only Given and Returned
 * Managers see all loans
 */
export const getAllLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const role = req.user.role;

    const where = { is_deleted: false };
    if (role === "Accountant") {
      where.status = ["Give_Request", "Return_Request"];
    } else if (role === "Cashier") {
      where.status = ["Given", "Returned"];
    }

    const { count, rows: loans } = await Loan.findAll({
      where,
      include: [
        {
          model: Employee,
          as: "borrower",
          attributes: [
            "first_name",
            "middle_name",
            "last_name",
            "email",
            "phone_number",
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (loans.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No loans found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loans retrieved successfully",
      data: loans,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in get all loans:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

/*
 * Update a loan
 */
export const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      to_who,
      from_whom,
      purpose,
      penalty,
      amount,
      interest_rate,
      start_date,
      end_date,
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const loan = await Loan.findOne({
      where: {
        loan_id: id,
        is_deleted: false,
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
        data: null,
      });
    }

    if (req.file && req.file.path) {
      // Delete old local image
      if (loan.receipt) {
        const oldPath = loan.receipt.replace(
          `${req.protocol}://${req.get("host")}/`,
          ""
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Assign new image URL from multer
      loan.receipt = `${req.protocol}://${req.get(
        "host"
      )}/${req.file.path.replace(/\\/g, "/")}`;
      await loan.save();
    }

    const to_update = {};

    if (start_date) to_update.start_date = start_date;
    if (end_date) to_update.end_date = end_date;
    if (amount) to_update.amount = amount;
    if (interest_rate) to_update.interest_rate = interest_rate;
    if (purpose) to_update.purpose = purpose;
    if (from_whom) to_update.from_whom = from_whom;
    if (to_who) to_update.to_who = to_who;
    if (penalty) to_update.penalty = penalty;

    await loan.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: loan,
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

/**
 * Delete a loan (soft delete)
 */
export const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findOne({
      where: {
        loan_id: id,
        is_deleted: false,
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
        data: null,
      });
    }

    await loan.update({
      is_deleted: true,
      deleted_by: req.user.id,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Loan deleted successfully",
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

/**
 * Update loan status manager can only send Return_Request
 * Accountant can approve/reject Give_Request and Return_Request
 * Cashier can mark Given and Returned loans as Paid
 */
export const updateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const role = req.user.role;

    const loan = await Loan.findOne({
      where: {
        loan_id: id,
        is_deleted: false,
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
        data: null,
      });
    }

    if (role === "Accountant") {
      allowedStatus = ["Give_Rejected", "Return_Rejected", "Given", "Returned"];
      if (!allowedStatus.includes(status)) {
        return res.status(403).json({
          success: false,
          message: `Accountant can only update status to: ${allowedStatus.join(
            ", "
          )}`,
          data: null,
        });
      }
    } else if (role === "Cashier") {
      if (status !== "Paid") {
        return res.status(403).json({
          success: false,
          message: `Cashier role can only update status to Paid`,
          data: null,
        });
      }
    } else if (role === "Manager") {
      if (status !== "Return_Request" && loan.to_who === null) {
        return res.status(403).json({
          success: false,
          message: `Manager role can only send Return_Request`,
          data: null,
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update loan status",
        data: null,
      });
    }

    if (loan.status === "Give_Request") {
      if (!["Give_Rejected", "Given"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${loan.status} to ${status}`,
          data: null,
        });
      }
    } else if (loan.status === "Return_Request") {
      if (!["Return_Rejected", "Returned"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${loan.status} to ${status}`,
          data: null,
        });
      }
    } else if (loan.status === "Given" || loan.status === "Returned") {
      if (status !== "Paid") {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${loan.status} to ${status}`,
          data: null,
        });
      }
    } else if (loan.status === "Received" && loan.to_who === null) {
      if (status !== "Return_Request") {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${loan.status} to ${status}`,
          data: null,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${loan.status} to ${status}`,
        data: null,
      });
    }

    const from_acc = await BankAccount.findOne({
      where: { account_name: "Peal", is_deleted: false },
    });
    if (!from_acc) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
        data: null,
      });
    }

    if (status === "Given" || status === "Returned") {
      if (from_acc.balance < loan.amount) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient balance in the bank account to give/return loan",
          data: null,
        });
      }
    }

    let receipt = null;
    let from_account = null;
    if (status === "Paid") {
      if (req.file) {
        receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
          /\\/g,
          "/"
        )}`;
      } else {
        return res.status(400).json({
          success: false,
          message: "Receipt is required when marking loan as Paid",
          data: null,
        });
      }
      from_account = from_acc.account_id;
    }

    await loan.update({
      status,
      receipt,
      from_account,
    });

    if (loan.status === "Paid") {
      await Expense.create({
        reason:
          loan.to_who !== null
            ? "Expense for employee loan"
            : "Expense for returning external loan",
        specific_reason:
          loan.to_who !== null
            ? `Loan given to employee ID: ${loan.to_who}`
            : `Loan returned to ${loan.from_whom}`,
        amount:
          loan.amount +
          loan.amount * 0.02 +
          (loan.to_who === null ? (loan.interest_rate * loan.amount) / 100 : 0),
        expensed_date: new Date(),
        from_account: from_acc.account_id,
        loan_id: loan.loan_id,
        status: "Paid",
        receipt: receipt,
      });

      from_acc.balance =
        Number(from_acc.balance) -
        Number(
          loan.amount +
            loan.amount * 0.02 +
            (loan.to_who === null
              ? (loan.interest_rate * loan.amount) / 100
              : 0)
        );
      await from_acc.save();
    }
  } catch (error) {
    console.error("Error in update loan status:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};
