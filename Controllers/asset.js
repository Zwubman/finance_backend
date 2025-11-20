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
      status,
    } = req.body;

    // Validation
    if (!name || !category || !transaction_type || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Determine source account for Bought assets. If `from_account` was
    // provided by the client we'll use it; otherwise default to the
    // `Vault` account. The `expenses` table requires `from_account` non-null,
    // so ensure we always resolve a valid account when recording the
    // purchase expense.
    let from_acc = null;
    if (transaction_type === "Bought") {
      if (from_account) {
        from_acc = await BankAccount.findOne({
          where: { account_id: from_account, is_deleted: false },
        });
        if (!from_acc) {
          return res.status(400).json({
            success: false,
            message: "Source bank account not found",
            data: null,
          });
        }
      } else {
        // fall back to Vault account when no explicit from_account provided
        from_acc = await BankAccount.findOne({
          where: { account_name: "Vault", is_deleted: false },
        });
        if (!from_acc) {
          return res.status(400).json({
            success: false,
            message:
              "Source bank account not found (no from_account provided and Vault account missing)",
            data: null,
          });
        }
      }
    }

    // Only validate destination account for sold assets (destination account
    // is not required for Bought assets)
    let to_acc = null;
    if (transaction_type === "Sold") {
      if (!to_account) {
        return res.status(400).json({
          success: false,
          message: "Destination bank account is required when selling an asset",
          data: null,
        });
      }

      to_acc = await BankAccount.findOne({
        where: { account_id: to_account, is_deleted: false },
      });
      if (!to_acc) {
        return res.status(400).json({
          success: false,
          message: "Destination bank account not found",
          data: null,
        });
      }
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

    // `status` refers to the asset lifecycle state (Available, In-Use, ...)
    // Ensure it matches the enum defined in Models/asset.js. Previously this
    // code validated against payment-like statuses which caused valid asset
    // status values from the frontend (e.g. "Available") to be rejected.
    const allowedStatuses = ["Available", "In-Use", "Maintenance", "Disposed"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    if (category === "Other" && !manual_category) {
      return res.status(400).json({
        success: false,
        message: "manual_category is required when category is 'Other'",
      });
    }
    let payment_status = null;
    if (transaction_type === "Bought") {
      payment_status = "Requested";
    } else if (transaction_type === "Sold") {
      payment_status = "Received";
    }

    let receipt = null;
    // If asset is sold, a receipt is expected. If not provided, we treat it
    // as optional but log a warning. If you want to enforce receipt, keep the
    // check below — currently we'll accept missing receipt.
    if (transaction_type === "Sold") {
      if (req.file) {
        receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
          /\\/g,
          "/"
        )}`;
      } else {
        // Do not hard-fail here to avoid blocking reads; return a warning
        // so frontend can surface it via toast if necessary.
        console.warn(
          "No receipt provided for sold asset. Proceeding without receipt."
        );
        receipt = null;
      }
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
      status,
      payment_status,
    });

    const qty = Number(quantity) || 1;
    const amount = Number(price) * qty;
    if (transaction_type === "Sold") {
      // Record income from asset sale
      await Income.create({
        source: "Income from asset sales",
        specific_source: `Sold asset: ${name}`,
        description: `Sale of ${quantity} unit(s) of ${asset.name}`,
        amount: amount,
        received_date: sold_date || new Date(),
        to_account: to_account,
        asset_id: asset.asset_id,
        receipt,
      });

      to_acc.balance = Number(to_acc.balance) + Number(amount);
      await to_acc.save();
    } else if (transaction_type === "Bought") {
      const createdExpense = await Expense.create({
        expense_reason: "Expense for asset purchase",
        specific_reason: `Purchased asset: ${asset.name}`,
        description: `Purchase ${asset.quantity} unit(s) of ${asset.name}`,
        amount: Number(asset.price) * asset.quantity,
        expensed_date: new Date(),
        asset_id: asset.asset_id,
        from_account: from_acc.account_id,
        status: "Requested",
        receipt,
      });

      from_acc.balance =
        Number(from_acc.balance) -
        Number(
          asset.price * asset.quantity + asset.price * asset.quantity * 0.02
        ); // Including 5% transaction fee
      await from_acc.save();

      // Expose the created expense so frontend can immediately show it
      console.log("Created expense for bought asset:", createdExpense.toJSON());
      return res.status(201).json({
        success: true,
        message: "Asset created successfully with appropriate financial records",
        data: { asset, expense: createdExpense },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Asset created successfully with appropriate financial records",
      data: asset,
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
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
    const role = req.user.role;

    // Currently the Asset model does not have a `payment_status` column
    // (it was commented out in the model). Avoid filtering by that column
    // to prevent DB errors. If you later add `payment_status` to the model
    // you can reintroduce role-based filtering here.
    const where = { is_deleted: false };

    const { count, rows: assets } = await Asset.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Return assets (may be empty) with pagination
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
    res.status(400).json({ success: false, message: error.message });
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
    res.status(400).json({ success: false, message: error.message });
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

    // Record who deleted the asset if available on the request
    const deletedBy = req.user?.user_id || null;
    await asset.update({
      is_deleted: true,
      deleted_by: deletedBy,
      deleted_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * * Update asset payment status
 */
// export const updateAssetPaymentStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { payment_status } = req.body;
//     const role = req.user.role;

//     const asset = await Asset.findOne({
//       where: { asset_id: id, is_deleted: false },
//     });
//     if (!asset) {
//       return res.status(404).json({
//         success: false,
//         message: "Asset not found",
//       });
//     }

//     const from_acc = await BankAccount.findOne({
//       where: { account_name: "Peal", is_deleted: false },
//     });
//     if (!from_acc) {
//       return res.status(400).json({
//         success: false,
//         message: "Source bank account not found",
//         data: null,
//       });
//     }

//     if (role === "Accountant") {
//       const allowedStatuses = ["Approved", "Rejected"];
//       if (!allowedStatuses.includes(payment_status)) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid payment status for accountant. Allowed: ${allowedStatuses.join(
//             ", "
//           )}`,
//           data: null,
//         });
//       }
//     } else if (role === "Cashier") {
//       const allowedStatuses = ["Paid"];
//       if (!allowedStatuses.includes(payment_status)) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid payment status for cashier. Allowed: ${allowedStatuses.join(
//             ", "
//           )}`,
//           data: null,
//         });
//       }
//     } else {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized role to update payment status",
//         data: null,
//       });
//     }

//     if (from_acc.balance < Number(asset.price * asset.quantity)) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient funds in source bank account",
//         data: null,
//       });
//     }

//     let receipt = null;
//     if (payment_status === "Paid") {
//       if (req.file) {
//         receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
//           /\\/g,
//           "/"
//         )}`;
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "Receipt is required when marking payment as Paid",
//           data: null,
//         });
//       }
//     }

//     await asset.update({
//       payment_status,
//     });

//     if (payment_status === "Paid") {
//       await Expense.create({
//         expense_reason: "Expense for asset purchase",
//         specific_reason: `Purchased asset: ${asset.name}`,
//         description: `Purchase ${asset.quantity} unit(s) of ${asset.name}`,
//         amount: Number(asset.price) * asset.quantity,
//         expensed_date: new Date(),
//         from_account: from_acc.account_id,
//         asset_id: asset.asset_id,
//         status: payment_status,
//         receipt,
//       });
//       from_acc.balance =
//         Number(from_acc.balance) -
//         Number(
//           asset.price * asset.quantity + asset.price * asset.quantity * 0.02
//         ); // Including 5% transaction fee
//       await from_acc.save();
//     }

//     res.status(200).json({
//       success: true,
//       message:
//         "Asset payment status updated successfully with appropriate financial records",
//       data: asset,
//     });
//   } catch (error) {
//     console.error("Error updating asset payment status:", error);
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
