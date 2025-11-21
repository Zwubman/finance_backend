import os from "os";
import process from "process";
import sequelize from "../Config/database.js";
import User from "../Models/user.js";
import Employee from "../Models/employee.js";
import Project from "../Models/project.js";
import Asset from "../Models/asset.js";
import Income from "../Models/income.js";
import Expense from "../Models/expense.js";
import Payable from "../Models/payable.js";
import Receivable from "../Models/receivable.js";
import Loan from "../Models/loan.js";
import BankAccount from "../Models/bank_account.js";
import AccountTransfer from "../Models/account_transfer.js";
import Payroll from "../Models/payroll.js";
import ExpenseRequest from "../Models/expense_request.js";

// System analytics / performance endpoint
export const getSystemAnalytics = async (req, res) => {
  try {
    // Parallel DB counts and sums
    const [
      userCount,
      employeeCount,
      projectCount,
      assetCount,
      incomeCount,
      expenseCount,
      payableCount,
      receivableCount,
      loanCount,
      payrollCount,
      expenseRequestCount,
      accountTransferCount,
    ] = await Promise.all([
      User.count({ where: { is_deleted: false } }).catch(() => 0),
      Employee.count({ where: { is_deleted: false } }).catch(() => 0),
      Project.count({ where: { is_deleted: false } }).catch(() => 0),
      Asset.count({ where: { is_deleted: false } }).catch(() => 0),
      Income.count({ where: { is_deleted: false } }).catch(() => 0),
      Expense.count({ where: { is_deleted: false } }).catch(() => 0),
      Payable.count({ where: { is_deleted: false } }).catch(() => 0),
      Receivable.count({ where: { is_deleted: false } }).catch(() => 0),
      Loan.count({ where: { is_deleted: false } }).catch(() => 0),
      Payroll.count({ where: { is_deleted: false } }).catch(() => 0),
      ExpenseRequest.count({ where: { is_deleted: false } }).catch(() => 0),
      AccountTransfer.count({ where: { is_deleted: false } }).catch(() => 0),
    ]);

    // Financial aggregates
    const [totalIncome, totalExpense] = await Promise.all([
      Income.sum("amount", { where: { is_deleted: false } }).catch(() => 0),
      Expense.sum("amount", { where: { is_deleted: false } }).catch(() => 0),
    ]);

    // Bank account balances
    const bankAccounts = await BankAccount.findAll({
      where: { is_deleted: false },
      attributes: ["account_id", "account_name", "balance","bank_name"],
    }).catch(() => []);

    // Process and OS metrics
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    // DB connection health
    let dbStatus = "unknown";
    try {
      await sequelize.authenticate();
      dbStatus = "connected";
    } catch (e) {
      dbStatus = "error";
    }

    // Try redis status if available without crashing
    let redisStatus = { available: false };
    try {
      // dynamic import to avoid failing when redis client exports can throw
      const redisConfig = await import("../Config/redis_config.js");
      const client = redisConfig.default;
      if (client && typeof client.ping === "function") {
        const pong = await client.ping().catch(() => null);
        redisStatus = { available: !!pong, pong };
      } else if (client && client.isFallback) {
        redisStatus = { available: false, fallback: true };
      }
    } catch (e) {
      // ignore - redis may not be configured or may throw on import
      redisStatus = { available: false };
    }

    return res.status(200).json({
      success: true,
      message: "System analytics retrieved successfully",
      data: {
        counts: {
          users: userCount || 0,
          employees: employeeCount || 0,
          projects: projectCount || 0,
          assets: assetCount || 0,
          incomes: incomeCount || 0,
          expenses: expenseCount || 0,
          payables: payableCount || 0,
          receivables: receivableCount || 0,
          loans: loanCount || 0,
          payrolls: payrollCount || 0,
          expense_requests: expenseRequestCount || 0,
          account_transfers: accountTransferCount || 0,
        },
        financials: {
          total_income: Number(totalIncome || 0),
          total_expense: Number(totalExpense || 0),
          net: Number((totalIncome || 0) - (totalExpense || 0)),
          bank_accounts: bankAccounts.map((b) => ({
            account_id: b.account_id,
            account_name: b.bank_name,
            balance: Number(b.balance || 0),
          })),
        },
        system: {
          node_version: process.version,
          uptime_seconds: Math.round(uptime),
          memory,
          cpuUsage,
          cpus: os.cpus().length,
          loadAvg,
          platform: os.platform(),
          release: os.release(),
          hostname: os.hostname(),
        },
        services: {
          database: dbStatus,
          redis: redisStatus,
        },
      },
    });
  } catch (error) {
    console.error("Error in getSystemAnalytics:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
