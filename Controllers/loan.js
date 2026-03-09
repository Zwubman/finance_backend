import Loan from "../Models/loan.js";
import Expense from "../Models/expense.js";
import Income from "../Models/income.js";
import Employee from "../Models/employee.js";
import BankAccount from "../Models/bank_account.js";
import db from "../Config/database.js";
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
      from_account,
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

    let from_acc = null;

    if (status === "Give_Request") {
      if (!from_account) {
        return res.status(400).json({
          success: false,
          message: "from_account is required when giving a loan",
        });
      }

      from_acc = await BankAccount.findOne({
        where: { account_id: from_account, is_deleted: false },
      });

      if (!from_acc) {
        return res.status(404).json({
          success: false,
          message: "From bank account not found",
        });
      }
    }

    // Normalize and sanitize inputs to avoid sending empty strings to integer/decimal columns
    let file = null;
    if (req.files?.file?.length > 0) {
      const uploadedFile = req.files.file[0];
      file = `${req.protocol}://${req.get("host")}/${uploadedFile.path.replace(
        /\\/g,
        "/",
      )}`;
    }

    let receipt = null;
    if (status === "Received" && req.files?.receipt?.length > 0) {
      const uploadedReceipt = req.files.receipt[0];
      receipt = `${req.protocol}://${req.get("host")}/${uploadedReceipt.path.replace(
        /\\/g,
        "/",
      )}`;
    }

    // Convert empty-string values to null and ensure numeric fields are numbers
    const cleanedToWho =
      to_who === "" || to_who === undefined ? null : Number(to_who);
    const cleanedAmount =
      amount === "" || amount === undefined ? null : Number(amount);
    const cleanedInterest =
      interest_rate === "" || interest_rate === undefined
        ? null
        : Number(interest_rate);
    const cleanedPenalty =
      penalty === "" || penalty === undefined ? null : Number(penalty);

    const loan = await Loan.create({
      to_who: cleanedToWho,
      from_whom,
      file,
      receipt,
      amount: cleanedAmount,
      interest_rate: cleanedInterest,
      start_date,
      end_date,
      purpose,
      penalty: cleanedPenalty,
      status,
      from_account: from_account || null,
      to_account: to_account || null,
    });

    const validStatuses = ["Received", "Repaid"];
    if (validStatuses.includes(status)) {
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
    return res.status(400).json({ success: false, message: error.message });
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
    return res.status(400).json({ success: false, message: error.message });
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
      where.status = [
        "Give_Request",
        "Return_Request",
        "Given",
        "Returned",
        "Received",
      ];
    } else if (role === "Cashier") {
      where.status = ["Given", "Returned", "Paid", "Received"];
    }

    const { count, rows: loans } = await Loan.findAndCountAll({
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
      order: [["createdAt", "DESC"]],
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
    return res.status(400).json({ success: false, message: error.message });
  }
};

/*
 * Update a loan
 */

export const updateLoan = async (req, res) => {
  const t = await db.transaction();

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
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    const loan = await Loan.findOne({
      where: {
        loan_id: id,
        is_deleted: false,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!loan) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // ================= FILE UPDATES =================

    if (req.files?.receipt?.[0]) {
      const newReceipt = req.files.receipt[0];

      if (loan.receipt) {
        const oldReceiptPath = loan.receipt.replace(
          `${req.protocol}://${req.get("host")}/`,
          "",
        );
        if (fs.existsSync(oldReceiptPath)) {
          fs.unlinkSync(oldReceiptPath);
        }
      }

      loan.receipt = `${req.protocol}://${req.get("host")}/${newReceipt.path.replace(/\\/g, "/")}`;
      await loan.save({ transaction: t });
    }

    if (req.files?.file?.[0]) {
      const newFile = req.files.file[0];

      if (loan.file) {
        const oldFilePath = loan.file.replace(
          `${req.protocol}://${req.get("host")}/`,
          "",
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      loan.file = `${req.protocol}://${req.get("host")}/${newFile.path.replace(/\\/g, "/")}`;
      await loan.save({ transaction: t });
    }

    // ================= FIELD UPDATES =================

    const to_update = {};

    if (start_date) to_update.start_date = start_date;
    if (end_date) to_update.end_date = end_date;
    if (interest_rate) to_update.interest_rate = interest_rate;
    if (purpose) to_update.purpose = purpose;
    if (from_whom) to_update.from_whom = from_whom;
    if (to_who) to_update.to_who = to_who;
    if (penalty) to_update.penalty = penalty;

    // ================= AMOUNT UPDATE LOGIC =================

    if (amount) {
      const newAmount = Number(amount);
      const oldAmount = Number(loan.amount);

      if (loan.status === "Received") {
        const to_acc = await BankAccount.findOne({
          where: {
            account_id: loan.to_account,
            is_deleted: false,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!to_acc) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: "Destination bank account not found",
          });
        }

        const income = await Income.findOne({
          where: {
            loan_id: loan.loan_id,
            is_deleted: false,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!income) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: "Associated income record not found",
          });
        }

        // Adjust bank balance safely
        to_acc.balance = Number(to_acc.balance) - oldAmount + newAmount;

        await to_acc.save({ transaction: t });

        income.amount = newAmount;
        await income.save({ transaction: t });
      }

      to_update.amount = newAmount;
    }

    await loan.update(to_update, { transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: loan,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating loan:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
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
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update loan status manager can only send Return_Request
 * Accountant can approve/reject Give_Request and Return_Request
 * Cashier can mark Given and Returned loans as Paid
 */
export const updateLoanStatus = async (req, res) => {
  console.log(req);
  try {
    const { id } = req.params;
    const { status, from_account } = req.body;
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
      const allowedStatus = [
        "Give_Rejected",
        "Return_Rejected",
        "Given",
        "Returned",
      ];
      if (!allowedStatus.includes(status)) {
        return res.status(403).json({
          success: false,
          message: `Accountant can only update status to: ${allowedStatus.join(
            ", ",
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

    let from_acc = null;

    if (loan.from_account) {
      // runs only if not null / not undefined
      from_acc = await BankAccount.findByPk(loan.from_account);

      if (!from_acc) {
        return res.status(404).json({
          success: false,
          message: "From account not found",
          data: null,
        });
      }
    } else if (from_account) {
      from_acc = await BankAccount.findByPk(from_account);
      if (!from_acc) {
        return res.status(404).json({
          success: false,
          message: "From account not found",
          data: null,
        });
      }
    }

    const balance = Number(from_acc.balance);
    const amount = Number(loan.amount);


    if (status === "Given" || status === "Returned") {
      if (balance < amount) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient balance in the bank account to give/return loan",
          data: null,
        });
      }
    }

    let receipt = null;
    if (status === "Paid") {
      if (req.file) {
        receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
          /\\/g,
          "/",
        )}`;
      } else {
        return res.status(400).json({
          success: false,
          message: "Receipt is required when marking loan as Paid",
          data: null,
        });
      }
    }

    await loan.update({
      status,
      receipt,
      from_account: from_acc.account_id,
    });



    if (loan.status === "Paid") {
      const expense = await Expense.create({
        expense_reason:
          loan.to_who !== null
            ? "Expense for employee loan"
            : "Expense for returning external loan",
        specific_reason:
          loan.to_who !== null
            ? `Loan given to employee ID: ${loan.to_who}`
            : `Loan returned to ${loan.from_whom}`,
        amount:
          loan.amount +
          (loan.to_who === null ? (loan.interest_rate * loan.amount) / 100 : 0),
        from_account: from_acc.account_id,
        loan_id: loan.loan_id,
        status: "Paid",
        receipt: loan.receipt,
      });

      from_acc.balance = Number(from_acc.balance) - Number(expense.amount);
      await from_acc.save();
    }

    // Respond with success and the updated loan
    const updatedLoan = await loan.reload();
    return res.status(200).json({
      success: true,
      message: "Loan status updated successfully",
      data: updatedLoan,
    });
  } catch (error) {
    console.error("Error in update loan status:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
