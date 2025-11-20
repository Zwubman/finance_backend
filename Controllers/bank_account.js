import BankAccount from "../Models/bank_account.js";

export const createBankAccount = async (req, res) => {
  try {
    const {
      account_name,
      account_owner_name,
      account_type,
      bank_name,
      account_number,
      currency,
      balance,
    } = req.body;

    // validation
    if (
      !account_name ||
      !account_owner_name ||
      !account_type ||
      !bank_name ||
      !account_number
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }
    
      // Validate enum-like fields early to return 400 instead of DB errors
      const allowedAccountNames = ["Vault", "Peal"];
      if (!allowedAccountNames.includes(account_name)) {
        return res.status(400).json({
          success: false,
          message: `Invalid account_name. Allowed: ${allowedAccountNames.join(", ")}`,
          data: null,
        });
      }

      const allowedAccountTypes = ["Checking", "Savings", "Credit"];
      if (!allowedAccountTypes.includes(account_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid account_type. Allowed: ${allowedAccountTypes.join(", ")}`,
          data: null,
        });
      }

    const bank_account = await BankAccount.create({
      account_name,
      account_owner_name,
      account_type,
      bank_name,
      account_number,
      currency,
      balance,
    });

    return res.status(201).json({
      success: true,
      message: "Bank account created successfully",
      data: bank_account,
    });
  } catch (error) {
    console.error("Error in create bank account:", error);
    return res
      .status(400)
      .json({ success: false, message: error.message });
  }
};

export const getBankAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const bankAccount = await BankAccount.findOne({
      where: { account_id: id, is_deleted: false },
    });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bank account retrieved successfully",
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error in get bank account by id:", error);
    return res
      .status(400)
      .json({ success: false, message: error.message });
  }
};

export const getAllBankAccounts = async (req, res) => {
  try {
    const role = req.user.role;
    const where = { is_deleted: false };

    if (role === "Accountant") {
      where.account_name = "Peal";
    }

    const bank_accounts = await BankAccount.findAll({
      where,
    });

    if (bank_accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bank accounts found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bank accounts retrieved successfully",
      data: bank_accounts,
    });
  } catch (error) {
    console.error("Error in get all bank accounts:", error);
    return res
      .status(400)
      .json({ success: false, message: error.message });
  }
};

export const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      account_name,
      account_owner_name,
      account_type,
      bank_name,
      account_number,
      currency,
      balance,
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const bank_account = await BankAccount.findOne({
      where: {
        account_id: id,
        is_deleted: false,
      },
    });

    const to_update = {};

    if (!bank_account) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
        data: null,
      });
    }

    if (account_name) to_update.account_name = account_name;
    if (account_owner_name) to_update.account_owner_name = account_owner_name;
    if (account_type) to_update.account_type = account_type;
    if (bank_name) to_update.bank_name = bank_name;
    if (account_number) to_update.account_number = account_number;
    if (currency) to_update.currency = currency;
    if (balance) to_update.balance = balance;

    await bank_account.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Bank account updated successfully",
      data: to_update,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const bank_account = await BankAccount.findOne({
      where: {
        account_id: id,
        is_deleted: false,
      },
    });

    if (!bank_account) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
        data: null,
      });
    }

    await bank_account.update({
      is_deleted: true,
      deleted_by: req.user.id,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Bank account deleted successfully",
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
