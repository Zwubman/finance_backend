import Receivable from "../Models/receivable.js";
import Project from "../Models/project.js";
import Loan from "../Models/loan.js";
import Asset from "../Models/asset.js";
import User from "../Models/user.js";
import BankAccount from "../Models/bank_account.js";
import Income from "../Models/income.js";

/*
 * Create a receivable Income
 */
export const createReceivable = async (req, res) => {
  try {
    const {
      income_source,
      specific_source,
      amount,
      description,
      project_id,
      loan_id,
      asset_id,
    } = req.body;

    const required_fields = ["income_source", "specific_source", "amount"];

    const missing_fields = required_fields.filter((field) => !req.body[field]);
    if (missing_fields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing_fields.join(", ")}`,
        data: null,
      });
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
    }

    if (loan_id) {
      const loan = await Loan.findOne({
        where: {
          loan_id,
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

    if (asset_id) {
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
    }

    const receivable = await Receivable.create({
      income_source,
      specific_source,
      amount,
      description,
      project_id,
      loan_id,
      asset_id,
    });

    res.status(200).json({
      success: true,
      message: "Receivable created successfully",
      data: receivable,
    });
  } catch (error) {
    console.log("Error in create receivable:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

/*
 * Get all receivables
 */
export const getAllReceivable = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: receivables } = await Receivable.findAndCountAll({
      where: { is_deleted: false },
      include: [
        { model: Project, as: "from_projects" },
        { model: Loan, as: "from_loans" },
        { model: Asset, as: "from_assets" },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (receivables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Receivables not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Receivables retrieved successfully",
      data: receivables,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.log("Error in get receivable:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

/*
 * Get receivable by id
 */
export const getReceivableById = async (req, res) => {
  try {
    const { id } = req.params;

    const receivable = await Receivable.findOne({
      where: { receivable_id: id, is_deleted: false },
      include: [
        { model: Project, as: "from_projects" },
        { model: Loan, as: "from_loans" },
        { model: Asset, as: "from_assets" },
      ],
    });

    if (!receivable) {
      return res.status(404).json({
        success: false,
        message: "Receivable record not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Receivable record retrieved successfully",
      data: receivable,
    });
  } catch (error) {
    console.log("Error in get receivable:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

/*
 * Update receivable
 */
export const updateReceivables = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      income_source,
      specific_source,
      amount,
      description,
      project_id,
      loan_id,
      asset_id,
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const receivable = await Receivable.findOne({
      where: { receivable_id: id, is_deleted: false },
    });
    if (!receivable) {
      return res.status(404).json({
        success: false,
        message: "Receivable record not found",
        data: null,
      });
    }

    const to_update = {};

    if (income_source) to_update.income_source = income_source;
    if (specific_source) to_update.specific_source = specific_source;
    if (amount) to_update.amount = amount;
    if (description) to_update.description = description;
    if (project_id) to_update.project_id = project_id;
    if (loan_id) to_update.loan_id = loan_id;
    if (asset_id) to_update.asset_id = asset_id;

    await receivable.update(to_update);

    res.status(200).json({
      success: true,
      message: "Receivable record updated successfully",
      data: receivable,
    });
  } catch (error) {
    console.log("Error in update receivable:", error);
    res.status(500).json({
      success: false,
      message: "Error in create receivable",
      data: null,
    });
  }
};

/*
 * Delete receivable record (soft delete)
 */
export const deleteReceivable = async (req, res) => {
  try {
    const { id } = req.params;
    const receivable = await Receivable.findOne({
      where: { receivable_id: id, is_deleted: false },
    });

    if (!receivable) {
      return res.status(404).json({
        success: false,
        message: "Receivable record not found",
        data: null,
      });
    }

    await receivable.update({
      is_deleted: true,
      deleted_by: req.user?.id || null,
      deleted_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Receivable record deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting receivable record:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

/*
 * update Receivable status
 */
export const updateReceivableStatus = async (req, res) => {
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

    const receivable = await Receivable.findOne({
      where: { receivable_id: id, is_deleted: false },
    });
    if (!receivable) {
      return res.status(404).json({
        success: false,
        message: "Receivable record not found",
        data: null,
      });
    }

    const to_acc = await BankAccount.findOne({
      where: {
        account_name: "Vault",
        is_deleted: false,
      },
    });
    if (!to_acc) {
      return res.status(404).json({
        success: false,
        message: "Vault account not found",
        data: null,
      });
    }

    if (status === "Approved" && receivable.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Receivable has been already approved.",
        data: null,
      });
    }

    let receipt = null;
    if (status === "approved" && receivable.status !== "Approved") {
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

    receivable.update({ status });

    if (receivable.status === "Approved") {
      await Income.create({
        income_source: receivable.income_source,
        specific_source: receivable.specific_source,
        amount: receivable.amount,
        description: receivable.description,
        received_date: new Date(),
        to_account: to_acc.account_id,
        project_id: receivable.project_id,
        loan_id: receivable.loan_id,
        asset_id: receivable.asset_id,
        receipt,
      });

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

      to_acc.update({
        balance:
          Number(to_acc.balance) +
          Number(receivable.amount) +
          Number(loan && loan.penalty ? loan.penalty : 0),
      });
    }

    res.status(200).json({
      success: true,
      message: "Receivable status updated successfully",
      data: receivable,
    });
  } catch (error) {
    console.log("Error in update receivable:", error);
    res.status(500).json({
      success: false,
      message: "Error in create receivable",
      data: null,
    });
  }
};
