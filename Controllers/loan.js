import Loan from "../Models/loan.js";
import User from "../Models/user.js";
import Expense from "../Models/expense.js";
import Income from "../Models/income.js";
import Employee from "../Models/employee.js";
import BankAccount from "../Models/bank_account.js";
import fs from "fs";

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
      from_account,
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

      if (!from_account) {
        return res.status(400).json({
          success: false,
          message: "from_account is required when loan is given to employee",
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

    if (from_account) {
      const bank_account = await BankAccount.findOne({
        where: { account_id: from_account, is_deleted: false },
      });

      if (!bank_account) {
        return res.status(404).json({
          success: false,
          message: "Bank account not found",
          data: null,
        });
      }
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

    if (status) {
      if (!["Given", "Received", "Returned"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
          data: null,
        });
      }
    }

    if (status === "Given" && !to_who) {
      return res.status(400).json({
        success: false,
        message: "to_who is required when status is Given",
        data: null,
      });
    }

    if (status === "Received" && !from_whom) {
      return res.status(400).json({
        success: false,
        message: "from_whom is required when status is Received",
        data: null,
      });
    }
    let receipt = null;
    if (req.file) {
      receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
        /\\/g,
        "/"
      )}`;
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

    if (status === "Given") {
      const employee = await Employee.findOne({
        where: { employee_id: to_who, is_deleted: false },
      });
      const expense = await Expense.create({
        expense_reason: "Expense for employee loan",
        specific_reason: `Loan given to employee: ${employee.first_name} ${employee.middle_name} ${employee.last_name} `,
        amount: amount,
        expensed_date: loan.createdAt,
        from_account: from_account,
        loan_id: loan.loan_id,
      });
    }

    if (status === "Received") {
      const income = await Income.create({
        income_source: "Income from loans",
        specific_source: `Loan received from ${from_whom}`,
        amount: amount,
        received_date: loan.createdAt,
        to_account: to_account,
        loan_id: loan.loan_id,
      });
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

export const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { is_deleted: false },
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
    });
  } catch (error) {
    console.error("Error in get all loans:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

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
      from_account,
      to_account,
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
      loan.receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
        /\\/g,
        "/"
      )}`;
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
    if (from_account) to_update.from_account = from_account;
    if (to_account) to_update.to_account = to_account;

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

export const updateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, to_account, from_account, penalty } = req.body;

    if (!status || !to_account) {
      return res.status(400).json({
        success: false,
        message: "Status and to_account are required",
        data: null,
      });
    }

    if (!["Returned"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
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

    if (loan.status === "Given" && status === "Returned") {
      const income = await Income.create({
        income_source: "Repaid from employee loan",
        specific_source: `Loan repaid from employee ID: ${loan.to_who}`,
        amount:
          loan.amount +
          (penalty ? penalty : 0) +
          (loan.interest_rate ? (loan.amount * loan.interest_rate) / 100 : 0),
        received_date: new Date(),
        to_account: to_account,
        loan_id: loan.loan_id,
      });
    } else if (loan.status === "Received" && status === "Returned") {
      const expense = await Expense.create({
        reason: "Expense for repaying loan to bank",
        specific_reason: `Loan repaid to ${loan.from_whom}`,
        amount:
          loan.amount +
          (penalty ? penalty : 0) +
          (loan.interest_rate ? (loan.amount * loan.interest_rate) / 100 : 0),
        expensed_date: new Date(),
        from_account: from_account,
        loan_id: loan.loan_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${loan.status} to ${status}`,
        data: null,
      });
    }

    await loan.update({ status });

    return res.status(200).json({
      success: true,
      message: "Loan status updated successfully with appropriate transactions",
      data: { status },
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
