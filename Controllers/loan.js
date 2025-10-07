import Loan from "../Models/loan.js";

export const createLoan = async (req, res) => {
  try {
    const { borrower_name, amount, interest_rate, start_date, end_date, status } =
      req.body;

    // validation
    if (!borrower_name || !amount || !interest_rate || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    if (status) {
      if (
        !["Pending", "Approved", "Rejected", "Paid"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
          data: null,
        });
      }
    }

    const loan = await Loan.create({
      borrower_name,
      amount,
      interest_rate,
      start_date,
      end_date,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Loan created successfully",
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
    const loans = await Loan.findAll({ where: { is_deleted: false } });

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
    const { borrower_name, amount, interest_rate, start_date, end_date, status } =
      req.body;

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

    const to_update = {};

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
        data: null,
      });
    }

    if (status) {
      if (
        !["Pending", "Approved", "Rejected", "Paid"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
          data: null,
        });
      }
      to_update.status = status;
    }

    if (borrower_name) to_update.borrower_name = borrower_name;
    if (start_date) to_update.start_date = start_date;
    if (end_date) to_update.end_date = end_date;
    if (amount) to_update.amount = amount;
    if (interest_rate) to_update.interest_rate = interest_rate;

    await loan.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: to_update,
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
