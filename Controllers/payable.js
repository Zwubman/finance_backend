import Payable from "../Models/payable.js";
import Expense from "../Models/expense.js";
import BankAccount from "../Models/bank_account.js";
import Project from "../Models/project.js";
import Loan from "../Models/loan.js";
import Asset from "../Models/asset.js";

/*
 * Create Payable
 */
export const createPayable = async (req, res) => {
  try {
    const {
      expense_reason,
      specific_reason,
      amount,
      description,
      project_id,
      loan_id,
      asset_id,
    } = req.body;

    const required_field = ["expense_reason", "specific_reason", "amount"];
    for (const field of required_field) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
          data: null,
        });
      }
    }

    if (project_id) {
      const project = await Project.findOne({
        where: {
          project_id,
          is_deleted: false,
        },
      });
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
          data: null,
        });
      }

      expense_reason = "Project expenses";
    } else if (asset_id) {
      const asset = await Asset.findOne({
        where: {
          asset_id,
          is_deleted: false,
        },
      });
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: "Asset not found",
          data: null,
        });
      }
      expense_reason = "Expense for asset purchase";
    }

    const payable = await Payable.create({
      expense_reason,
      specific_reason,
      amount,
      description,
      project_id,
      loan_id,
      asset_id,
    });

    return res.status(201).json({
      success: true,
      message: "Payable created successfully",
      data: payable,
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

/*
 * Get All Payables
 */
export const getAllPayables = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { is_deleted: false };

    const { count, rows: payables } = await Payable.findAll({
      where,
      include: [
        { model: Project, as: "for_projects" },
        { model: Loan, as: "for_loans" },
        { model: Asset, as: "for_assets" },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (payables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payables not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payables retrieved successfully",
      data: payables,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
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

/*
 * Get Payable by id
 */
export const getPayableById = async (req, res) => {
  try {
    const { id } = req.params;

    const payable = await Payable.findOne({
      where: { payable_id: id, is_deleted: false },
      include: [
        { model: Project, as: "for_projects" },
        { model: Loan, as: "for_loans" },
        { model: Asset, as: "for_assets" },
      ],
    });

    if (!payable) {
      return res.status(404).json({
        success: false,
        message: "Payable record not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Payable record retrieved successfully",
      data: payable,
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

/*
 * Delete Payable record (soft delete)
 */
export const deletePayable = async (req, res) => {
  try {
    const { id } = req.params;
    const payable = await Payable.findOne({
      where: { payable_id: id, is_deleted: false },
    });

    if (!payable) {
      return res.status(404).json({
        success: false,
        message: "Payable record not found",
        data: null,
      });
    }

    await payable.update({
      is_deleted: true,
      deleted_by: req.user?.id || null,
      deleted_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Payable record deleted successfully",
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

/*
 * Update Payable record
 */
export const updatePayable = async (req, res) => {
  try {
    const { id } = req.params;
    const { expense_reason, specific_reason, amount, description } = req.body;

    const payable = await Payable.findOne({
      where: { payable_id: id, is_deleted: false },
    });

    if (!payable) {
      return res.status(404).json({
        success: false,
        message: "Payable record not found",
        data: null,
      });
    }

    const to_update = {};

    if (expense_reason) to_update.expense_reason = expense_reason;
    if (specific_reason) to_update.specific_reason = specific_reason;
    if (amount) to_update.amount = amount;
    if (description) to_update.description = description;

    await payable.update(to_update);

    res.status(200).json({
      success: true,
      message: "Payable record updated successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error in update payable", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

/*
 * Update payable status
 */
export const updatePayableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed_status = ["Approved", "Rejected"];
    if (!allowed_status.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed_status.join(", ")}`,
        data: null,
      });
    }

    const payable = await Payable.findOne({
      where: { payable_id: id, is_deleted: false },
    });
    if (!payable) {
      return res.status(404).json({
        success: false,
        message: "Payable record not found",
        data: null,
      });
    }

    const from_acc = await BankAccount.findOne({
      where: {
        account_name: "Peal",
        is_deleted: false,
      },
    });
    if (from_acc) {
      return res.status(400).json({
        success: false,
        message: "Source bank account not found",
        data: null,
      });
    }

    if (from_acc.balance < Number(payable.amount + payable.amount * 0.02)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        data: null,
      });
    }

    if (status === "Approved" && payable.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Payable already approved",
        data: null,
      });
    }

    let receipt = null;
    if (status === "Approved") {
      if (req.file) {
        receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
          /\\/g,
          "/"
        )}`;
      } else {
        return res.status(400).json({
          success: false,
          message: "Receipt is required for approved income.",
          data: null,
        });
      }
    }

    await payable.update({ status });

    if (payable.status === "Approved") {
      let loan = null;
      if (receivable.loan_id !== null) {
        loan = await Loan.findOne({
          where: {
            loan_id: receivable.loan_id,
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
      }

      let amount = 0;
      if (expense_reason === "Expense for returning external loan") {
        amount = Number(
          payable.amount +
            payable.amount * 0.02 +
            (payable.amount * loan.interest_rate) / 100
        );
      } else {
        amount = Number(payable.amount + payable.amount * 0.02);
      }

      await Expense.create({
        expense_reason: payable.expense_reason,
        specific_reason: payable.specific_reason,
        amount: amount,
        description: payable.description,
        expensed_date: new Date(),
        from_account: from_acc.account_id,
        project_id: payable.project_id,
        loan_id: payable.loan_id,
        asset_id: payable.asset_id,
        receipt,
      });

      from_acc.balance = Number(from_acc.balance - amount);
      await from_acc.save();
    }

    res.status(200).json({
      success: true,
      message: "Payable status updated successfully",
      data: payable,
    });
  } catch (error) {
    console.error("Error in update payable status", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};


