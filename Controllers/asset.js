import Asset from "../Models/asset.js";
import Expense from "../Models/expense.js";
import Income from "../Models/income.js";
import BankAccount from "../Models/bank_account.js";

/**
 * Create a new asset
 */
export const createAsset = async (req, res) => {
  try {
    const {
      name,
      category,
      manual_category,
      quantity,
      transaction_type,
      purchase_date,
      sold_date,
      price,
      vendor,
      to_account,
      from_account,
    } = req.body;

    // Validation
    if (!name || !category || !transaction_type || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
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

    const to_acc = await BankAccount.findOne({
      where: { account_id: to_account, is_deleted: false },
    });
    if (!to_acc) {
      return res.status(400).json({
        success: false,
        message: "Destination bank account not found",
        data: null,
      });
    }

    const allowedCategories = ["Electronics", "Furniture", "Vehicle", "Other"];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed: ${allowedCategories.join(", ")}`,
      });
    }

    const allowedTransactionTypes = ["Bought", "Sold"];
    if (!allowedTransactionTypes.includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transaction type. Allowed: ${allowedTransactionTypes.join(
          ", "
        )}`,
      });
    }

    if (category === "Other" && !manual_category) {
      return res.status(400).json({
        success: false,
        message: "manual_category is required when category is 'Other'",
      });
    }

    // Create asset
    const asset = await Asset.create({
      name,
      category,
      quantity,
      transaction_type,
      purchase_date: purchase_date || null,
      sold_date: sold_date || null,
      price: Number(price),
      vendor: vendor || null,
    });

    let receipt = null;
    if (req.file) {
      receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
        /\\/g,
        "/"
      )}`;
    }

    const amount = Number(price) * (quantity || 1);
    if (transaction_type === "Bought") {
      // Record expense for asset purchase
      await Expense.create({
        reason: "Expense for asset purchase",
        specific_reason: `Purchased asset: ${name}`,
        amount: amount,
        expensed_date: purchase_date || new Date(),
        from_account: from_account,
        asset_id: asset.asset_id,
        description: `Asset purchase - ${name}`,
        receipt,
      });

      from_acc.balance =
        Number(from_acc.balance) - Number(amount + amount * 0.02); // Assuming 2% transaction fee
      await from_acc.save();
    }
    if (transaction_type === "Sold") {
      // Record income from asset sale
      await Income.create({
        source: "Income from asset sales",
        specific_source: `Sold asset: ${name}`,
        amount: amount,
        received_date: sold_date || new Date(),
        to_account: to_account,
        asset_id: asset.asset_id,
        description: `Asset sale - ${name}`,
        receipt,
      });

      to_acc.balance = Number(to_acc.balance) + Number(amount);
      await to_acc.save();
    }

    return res.status(201).json({
      success: true,
      message: "Asset created successfully with appropriate financial records",
      data: asset,
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 *  Get all assets
 *  */
export const getAllAssets = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: assets } = await Asset.findAndCountAll({
      where: { is_deleted: false },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No assets found",
      });
    }

    res.status(200).json({
      success: true,
      message: "All assets retrieved successfully",
      data: assets,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Get asset by ID
 */
export const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findOne({
      where: { asset_id: id, is_deleted: false },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error("Error fetching asset by ID:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Update asset by ID
 */
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      quantity,
      transaction_type,
      purchase_date,
      sold_date,
      price,
      vendor,
      manual_category,
    } = req.body;

    const asset = await Asset.findOne({
      where: { asset_id: id, is_deleted: false },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const to_update = {};

    if (name) to_update.name = name;
    if (category) to_update.category = category;
    if (manual_category) to_update.manual_category = manual_category;
    if (quantity) to_update.quantity = quantity;
    if (transaction_type) to_update.transaction_type = transaction_type;
    if (purchase_date) to_update.purchase_date = purchase_date;
    if (sold_date) to_update.sold_date = sold_date;
    if (price) to_update.price = price;
    if (vendor) to_update.vendor = vendor;

    await asset.update(to_update);

    res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      data: asset,
    });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete asset by ID (soft delete)
 */
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findOne({
      where: { asset_id: id, is_deleted: false },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    await asset.update({
      is_deleted: true,
      deleted_by: deleted_by,
      deleted_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
