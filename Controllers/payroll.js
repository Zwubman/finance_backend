import Payroll from "../Models/payroll.js";
import Employee from "../Models/employee.js";
import Expense from "../Models/expense.js";
import BankAccount from "../Models/bank_account.js";
import { Op } from "sequelize";
import sequelize from "../Config/database.js";
import fs from "fs";

/**
 * Create payroll for a single employee.
 * If gross_amount not provided, uses employee.salary.
 */
export const createPayroll = async (req, res) => {
  try {
    const { employee_id, gross_amount, deductions = 0, pay_date } = req.body;

    if (!employee_id) {
      return res.status(400).json({ success: false, message: "employee_id is required", data: null });
    }

    const employee = await Employee.findOne({ where: { employee_id, is_deleted: false } });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found", data: null });
    }

    const gross = gross_amount !== undefined ? Number(gross_amount) : Number(employee.salary || 0);
    const ded = Number(deductions || 0);
    const net = gross - ded;

    if (net < 0) {
      return res.status(400).json({ success: false, message: "Net amount cannot be negative", data: null });
    }

    // handle optional uploaded recipient file (payslip, receipt, etc.)
    let recipient_file = null;
    if (req.file && req.file.path) {
      // validate allowed types and size for payroll recipient files
      const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (!allowed.includes(req.file.mimetype)) {
        // remove uploaded file
        try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        return res.status(400).json({ success: false, message: "Invalid recipient file type. Allowed: PDF, JPEG, PNG, WEBP", data: null });
      }
      if (req.file.size && req.file.size > maxBytes) {
        try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        return res.status(400).json({ success: false, message: "Recipient file too large (max 5MB)", data: null });
      }

      recipient_file = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
    }

    const payroll = await Payroll.create({
      employee_id,
      gross_amount: gross,
      deductions: ded,
      net_amount: net,
      pay_date: pay_date ? new Date(pay_date) : new Date(),
      status: "Pending",
      recipient_file,
    });

    return res.status(201).json({ success: true, message: "Payroll created", data: payroll });
  } catch (error) {
    console.error("Error creating payroll:", error);
    return res.status(500).json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findOne({
      where: { payroll_id: id, is_deleted: false },
      include: [{ model: Employee, as: "employee" }, { model: Expense, as: "expense" }],
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll not found", data: null });
    }

    // normalize recipient_file to full URL if stored as path
    const result = payroll.toJSON ? payroll.toJSON() : { ...payroll };
    if (result.recipient_file && !result.recipient_file.startsWith("http")) {
      result.recipient_file = `${req.protocol}://${req.get("host")}/${result.recipient_file.replace(/\\/g, "/")}`;
    }

    return res.status(200).json({ success: true, message: "Payroll retrieved", data: result });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return res.status(500).json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getAllPayrolls = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: payrolls } = await Payroll.findAndCountAll({
      where: { is_deleted: false },
      include: [{ model: Employee, as: "employee" }, { model: Expense, as: "expense" }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["pay_date", "DESC"]],
    });

    if (payrolls.length === 0) {
      return res.status(404).json({ success: false, message: "No payrolls found", data: null });
    }

    // normalize recipient_file URLs
    const serialized = payrolls.map((p) => {
      const item = p.toJSON ? p.toJSON() : { ...p };
      if (item.recipient_file && !item.recipient_file.startsWith("http")) {
        item.recipient_file = `${req.protocol}://${req.get("host")}/${item.recipient_file.replace(/\\/g, "/")}`;
      }
      return item;
    });

    return res.status(200).json({
      success: true,
      message: "Payrolls retrieved",
      data: serialized,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error("Error fetching payrolls:", error);
    return res.status(500).json({ success: false, message: "Server Error", Error: error.message });
  }
};

/**
 * Mark a payroll as paid. This will create an Expense record and deduct from the Vault bank account.
 */
export const payPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    // use a transaction to ensure atomicity
    const t = await sequelize.transaction();
    try {
      const payroll = await Payroll.findOne({ where: { payroll_id: id, is_deleted: false }, transaction: t, lock: t.LOCK ? t.LOCK.UPDATE : undefined });
      if (!payroll) {
        await t.rollback();
        return res.status(404).json({ success: false, message: "Payroll not found", data: null });
      }

      if (payroll.status === "Paid") {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Payroll already paid", data: null });
      }

      const employee = await Employee.findOne({ where: { employee_id: payroll.employee_id, is_deleted: false }, transaction: t, lock: t.LOCK ? t.LOCK.UPDATE : undefined });
      if (!employee) {
        await t.rollback();
        return res.status(404).json({ success: false, message: "Employee not found", data: null });
      }

      const from_acc = await BankAccount.findOne({ where: { account_name: "Vault", is_deleted: false }, transaction: t, lock: t.LOCK ? t.LOCK.UPDATE : undefined });
      if (!from_acc) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Source bank account not found", data: null });
      }

      const amount = Number(payroll.net_amount || 0);
      const fee = amount * 0.02;
      if (Number(from_acc.balance) < amount + fee) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Insufficient balance to pay payroll", data: null });
      }

      // create expense record within transaction
      const specific_reason = `Salary payment for ${employee.first_name} ${employee.last_name} (payroll ${payroll.payroll_id})`;
      const newExpense = await Expense.create({
        expense_reason: "Employee Costs",
        specific_reason,
        amount,
        description: `Payroll payment - payroll_id:${payroll.payroll_id}`,
        expensed_date: new Date(),
        from_account: from_acc.account_id,
        status: "Paid",
      }, { transaction: t });

      // deduct from bank account
      from_acc.balance = Number(from_acc.balance) - (amount + fee);
      await from_acc.save({ transaction: t });

      // update payroll
      payroll.status = "Paid";
      payroll.expense_id = newExpense.expense_id;
      await payroll.save({ transaction: t });

      await t.commit();
      return res.status(200).json({ success: true, message: "Payroll paid and expense created", data: { payroll, expense: newExpense } });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Error paying payroll:", error);
    return res.status(500).json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findOne({ where: { payroll_id: id, is_deleted: false } });
    if (!payroll) return res.status(404).json({ success: false, message: "Payroll not found", data: null });

    await payroll.update({ is_deleted: true, deleted_at: new Date(), deleted_by: req.user?.id || null });
    return res.status(200).json({ success: true, message: "Payroll deleted (soft)", data: null });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return res.status(500).json({ success: false, message: "Server Error", Error: error.message });
  }
};
