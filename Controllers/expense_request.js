import BankAccount from "../Models/bank_account.js";
import Employee from "../Models/employee.js";
import ExpenseRequest from "../Models/expense_request.js";

/*
 * Create a new expense request
 */
export const createExpenseRequest = async (req, res) => {
  try {
    const {
      employee_id,
      employee_name,
      place_of_origin,
      place_to_travel,
      departure_date,
      return_date,
      purpose,
      amount,
      daily_allowance,
      total_allowance,
      total_transport_amount,
      total_amount,
      bank_account_number,
      bank_name,
    } = req.body;

    if (!employee_id || !employee_name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }

    const employee = await Employee.findOne({
      where: { employee_id, is_deleted: false },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });
    }

    const expense_request = await ExpenseRequest.create({
      employee_id,
      employee_name,
      place_of_origin,
      place_to_travel,
      departure_date,
      return_date,
      purpose,
      amount,
      requested_by: req.user.id,
      daily_allowance,
      total_allowance,
      total_transport_amount,
      total_amount,
      bank_account_number,
      bank_name,
    });

    return res.status(201).json({
      success: true,
      message: "Expense request created successfully",
      data: expense_request,
    });
  } catch (error) {
    console.log("Error in creating expense request:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * Get all expense requests
 */
export const getAllExpenseRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    offset = (page - 1) * limit;

    const role = req.user.role;

    const where = { is_deleted: false };
    if (role === "Accountant") {
      condition.status = ["Requested"];
    } else if (role === "Cashier") {
      condition.status = ["Approved"];
    }

    const { count, rows: expense_requests } = await ExpenseRequest.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (expense_requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No expense requests found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense requests retrieved successfully",
      data: expense_requests,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in get all expense requests:", error);
    return res
      .status(400)
      .json({ success: false, message: error.message });
  }
};

/*
 * Get an expense request by ID
 */
export const getExpenseRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const expense_request = await ExpenseRequest.findOne({
      where: { request_id: id, is_deleted: false },
    });

    if (!expense_request) {
      return res.status(404).json({
        success: false,
        message: "Expense request not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense request retrieved successfully",
      data: expense_request,
    });
  } catch (error) {
    console.error("Error in get expense request by id:", error);
    return res
      .status(400)
      .json({ success: false, message: error.message });
  }
};

/*
 * Delete an expense request
 */
export const deleteExpenseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const expense_request = await ExpenseRequest.findOne({
      where: { request_id: id, is_deleted: false },
    });

    if (!expense_request) {
      return res.status(404).json({
        success: false,
        message: "Expense request not found",
        data: null,
      });
    }

    await expense_request.update({
      is_deleted: true,
      deleted_by: req.user.id,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Expense request deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error in delete expense request:", error);
    return res
      .status(400)
      .json({ success: false, message: error.message });
  }
};

/*
 * Update an expense request
 */
export const updateExpenseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      employee_name,
      place_of_origin,
      place_to_travel,
      departure_date,
      return_date,
      purpose,
      amount,
      daily_allowance,
      total_allowance,
      total_transport_amount,
      total_amount,
      bank_account_number,
      bank_name,
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const expense_request = await ExpenseRequest.findOne({
      where: { request_id: id, is_deleted: false },
    });
    if (!expense_request) {
      return res.status(404).json({
        success: false,
        message: "Expense request not found",
        data: null,
      });
    }

    const employee = await Employee.findOne({
      where: { employee_id, is_deleted: false },
    });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });
    }

    const to_update = {};
    if (employee_id) to_update.employee_id = employee_id;
    if (employee_name) to_update.employee_name = employee_name;
    if (place_of_origin) to_update.place_of_origin = place_of_origin;
    if (place_to_travel) to_update.place_to_travel = place_to_travel;
    if (departure_date) to_update.departure_date = departure_date;
    if (return_date) to_update.return_date = return_date;
    if (purpose) to_update.purpose = purpose;
    if (amount) to_update.amount = amount;
    if (daily_allowance) to_update.daily_allowance = daily_allowance;
    if (total_allowance) to_update.total_allowance = total_allowance;
    if (total_transport_amount)
      to_update.total_transport_amount = total_transport_amount;
    if (total_amount) to_update.total_amount = total_amount;
    if (bank_account_number)
      to_update.bank_account_number = bank_account_number;
    if (bank_name) to_update.bank_name = bank_name;

    await expense_request.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Expense request updated successfully",
      data: expense_request,
    });
  } catch (error) {
    console.error("Error in update expense request:", error);
    return res
      .status(400)
      .json({ success: false, message: error.message });
  }
};

/*
 * Update expense request status
 */
export const updateExpenseRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const role = req.user.role;

    const expense_request = await ExpenseRequest.findOne({
      where: { request_id: id, is_deleted: false },
    });
    if (!expense_request) {
      return res.status(404).json({
        success: false,
        message: "Expense request not found",
        data: null,
      });
    }

    let allowed_status;
    if (role === "Accountant") {
      allowed_status = ["Approved", "Rejected"];
      if (!allowed_status.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${allowed_status.join(", ")}`,
          data: null,
        });
      }
    } else if (role === "Cashier") {
      allowed_status = ["Paid"];
      if (!allowed_status.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${allowed_status.join(", ")}`,
          data: null,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Unauthorized to update expense request status",
        data: null,
      });
    }

    if (expense_request.status === "Rejected" && status === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Expense request cannot be paid after rejection",
        data: null,
      });
    }

    let approved_by = null;
    if (status === "Approved") {
      approved_by = req.user.user_id;
    }

    let allowance_receipt = null;
    if (status === "Paid") {
      if (req.file) {
        allowance_receipt = `${req.protocol}://${req.get(
          "host"
        )}/${req.file.path.replace(/\\/g, "/")}`;
      } else {
        return res.status(400).json({
          success: false,
          message: "Receipt is required for paid status",
          data: null,
        });
      }
    }

    const from_acc = await BankAccount.findOne({
      where: { account_name: "Peal", is_deleted: false },
    });
    if (!from_acc) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
        data: null,
      });
    }

    if (from_acc.balance < expense_request.total_allowance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in Peal account",
        data: null,
      });
    }

    await expense_request.update({
      status,
      allowance_receipt,
      approved_by,
    });

    if (expense_request.status === "Paid") {
      await Expense.create({
        expensed_reason: "Allowance expense",
        specific_reason: `Allowance for employee ${expense_request.employee_name}`,
        amount: expense_request.total_allowance,
        expensed_date: new Date(),
        from_account: from_acc.account_id,
        allowance_receipt,
      });

      from_acc.balance =
        from_acc.balance -
        (expense_request.total_allowance +
          expense_request.total_allowance * 0.02);
      await from_acc.save();
    }

    return res.status(200).json({
      success: true,
      message: "Expense request status updated successfully",
      data: expense_request,
    });
  } catch (error) {
    console.error("Error in update expense request status:", error);
    return res
      .status(400)
      .json({ success: false, message: error.message });
  }
};
