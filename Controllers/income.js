import Income from "../Models/income.js";
import fs from "fs";

export const createIncome = async (req, res) => {
  try {
    const { source, amount, income_date, description, purpose } = req.body;

    // Validate required fields
    if (!source || !amount || !income_date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }

    // Handle receipt file if uploaded
    let receiptPath = null;
    if (req.file) {
      receiptPath = req.file.path;
    } else {
      return res.status(400).json({
        success: false,
        message: "Receipt file is required",
        data: null,
      });
    }

    // Create the income record
    const newIncome = await Income.create({
      source,
      amount,
      income_date,
      description,
      purpose,
      receipt: receiptPath,
    });

    return res.status(201).json({
      success: true,
      message: "Income record created successfully",
      data: newIncome,
    });
  } catch (error) {
    console.error("Error creating income record:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};
