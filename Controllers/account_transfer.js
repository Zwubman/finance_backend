import sequelize from "../Config/database.js";
import BankAccount from "../Models/bank_account.js";
import AccountTransfer from "../Models/account_transfer.js";
import fs from "fs";

export const createAccountTransfer = async (req, res) => {
  const t = await sequelize.transaction(); // Start a transaction

  try {
    const {
      from_account,
      to_account,
      amount,
      transfer_date,
      description,
      purpose,
    } = req.body;

    // Validate required fields
    if (!from_account || !to_account || !amount || !transfer_date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }

    if (from_account === to_account) {
      return res.status(400).json({
        success: false,
        message: "From and To account cannot be the same",
        data: null,
      });
    }

    // Fetch accounts
    const fromAcc = await BankAccount.findOne({
      where: { account_id: from_account, is_deleted: false },
      transaction: t,
    });

    const toAcc = await BankAccount.findOne({
      where: { account_id: to_account, is_deleted: false },
      transaction: t,
    });

    if (!fromAcc || !toAcc) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "One or both bank accounts not found",
        data: null,
      });
    }

    const fromBalance = parseFloat(fromAcc.balance);
    const transferAmount = parseFloat(amount);

    if (fromBalance < transferAmount) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in the from account",
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

    // Create transfer record
    const transfer = await AccountTransfer.create(
      {
        from_account: fromAcc.account_id,
        to_account: toAcc.account_id,
        amount: transferAmount,
        description,
        transfer_date,
        purpose,
        receipt,
      },
      { transaction: t }
    );

    // Update balances
    fromAcc.balance = fromBalance - transferAmount;
    toAcc.balance = parseFloat(toAcc.balance) + transferAmount;

    await fromAcc.save({ transaction: t });
    await toAcc.save({ transaction: t });

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Account transfer created successfully",
      data: transfer,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error creating account transfer:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
    });
  }
};

export const getAllAccountTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: transfers } = await AccountTransfer.findAndCountAll({
      where: { is_deleted: false },
      include: [
        { model: BankAccount, as: "from_acc" },
        { model: BankAccount, as: "to_acc" },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    console.log("Transfers fetched:", transfers);

    return res.status(200).json({
      success: true,
      message: "Account transfers retrieved successfully",
      data: transfers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in get all account transfers:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
    });
  }
};

export const getAccountTransferById = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await AccountTransfer.findOne({
      where: { transfer_id: id, is_deleted: false },
      include: [
        { model: BankAccount, as: "from_acc" },
        { model: BankAccount, as: "to_acc" },
      ],
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Account transfer not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account transfer retrieved successfully",
      data: transfer,
    });
  } catch (error) {
    console.error("Error in get account transfer by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
    });
  }
};

export const updateAccountTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      from_account,
      to_account,
      amount,
      transfer_date,
      description,
      purpose,
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const transfer = await AccountTransfer.findOne({
      where: { transfer_id: id, is_deleted: false },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Account transfer not found",
        data: null,
      });
    }

    // If accounts are being changed, validate them
    let from_accounts = null;
    let to_accounts = null;

    if (from_account && from_account !== transfer.from_account) {
      from_accounts = await BankAccount.findOne({
        where: { account_id: from_account, is_deleted: false },
      });
      if (!from_accounts) {
        return res.status(404).json({
          success: false,
          message: "From bank account not found",
          data: null,
        });
      }
    }

    if (to_account && to_account !== transfer.to_account) {
      to_accounts = await BankAccount.findOne({
        where: { account_id: to_account, is_deleted: false },
      });
      if (!to_accounts) {
        return res.status(404).json({
          success: false,
          message: "To bank account not found",
          data: null,
        });
      }
    }

    if (req.file && req.file.path) {
      // Delete old local image
      if (AccountTransfer.receipt) {
        const oldPath = AccountTransfer.receipt.replace(
          `${req.protocol}://${req.get("host")}/`,
          ""
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Assign new image URL from multer
      AccountTransfer.receipt = `${req.protocol}://${req.get(
        "host"
      )}/${req.file.path.replace(/\\/g, "/")}`;
      await AccountTransfer.save();
    }

    const to_update = {};

    if (from_account) to_update.from_account = from_account;
    if (to_account) to_update.to_account = to_account;
    if (amount) to_update.amount = amount;
    if (transfer_date) to_update.transfer_date = transfer_date;
    if (description) to_update.description = description;
    if (purpose) to_update.purpose = purpose;

    await transfer.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Account transfer updated successfully",
      data: transfer,
    });
  } catch (error) {
    console.error("Error in update account transfer:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
    });
  }
};

export const deleteAccountTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await AccountTransfer.findOne({
      where: { transfer_id: id, is_deleted: false },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Account transfer not found",
        data: null,
      });
    }

    // Soft delete the transfer
    await transfer.update({
      is_deleted: true,
      deleted_by: req.user.id,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Account transfer deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error in delete account transfer:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
    });
  }
};
