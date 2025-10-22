import BudgetPlan from "../Models/budget_plan.js";

/**
 * Create a new budget plan
 */
export const createBudgetPlan = async (req, res) => {
  try {
    const {
      year,
      month,
      planned_income,
      planned_expense,
      actual_income,
      actual_expense,
    } = req.body;

    // Validate required fields
    if (!year || !month || !planned_income || !planned_expense) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    // Create the budget plan
    const budget_plan = await BudgetPlan.create({
      year,
      month,
      planned_income,
      planned_expense,
      actual_expense,
      actual_income,
    });

    return res.status(201).json({
      success: true,
      message: "Budget plan created successfully",
      data: budget_plan,
    });
  } catch (error) {
    console.error("Error in create budget plan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

/**
 * Get all budget plans
 */
export const getAllBudgetPlans = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const budget_plans = await BudgetPlan.findAll({
      where: { is_deleted: false },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      message: "Budget plans retrieved successfully",
      data: budget_plans,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in get all budget plans:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

/**
 * Get a budget plan by ID
 */
export const getBudgetPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const budget_plan = await BudgetPlan.findOne({
      where: { budget_plan_id: id, is_deleted: false },
    });

    if (!budget_plan) {
      return res.status(404).json({
        success: false,
        message: "Budget plan not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget plan retrieved successfully",
      data: budget_plan,
    });
  } catch (error) {
    console.error("Error in get budget plan by ID:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

/**
 * Update a budget plan
 */
export const updateBudgetPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      year,
      month,
      planned_income,
      planned_expense,
      actual_income,
      actual_expense,
    } = req.body;

    const budget_plan = await BudgetPlan.findOne({
      where: { budget_plan_id: id, is_deleted: false },
    });

    if (!budget_plan) {
      return res.status(404).json({
        success: false,
        message: "Budget plan not found",
        data: null,
      });
    }

    const to_update = {};
    if (year !== undefined) to_update.year = year;
    if (month !== undefined) to_update.month = month;
    if (planned_income !== undefined) to_update.planned_income = planned_income;
    if (planned_expense !== undefined)
      to_update.planned_expense = planned_expense;
    if (actual_income !== undefined) to_update.actual_income = actual_income;
    if (actual_expense !== undefined) to_update.actual_expense = actual_expense;

    await budget_plan.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Budget plan updated successfully",
      data: budget_plan,
    });
  } catch (error) {
    console.error("Error in update budget plan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

/**
 * Soft delete a budget plan
 */
export const deleteBudgetPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const budget_plan = await BudgetPlan.findOne({
      where: { budget_plan_id: id, is_deleted: false },
    });

    if (!budget_plan) {
      return res.status(404).json({
        success: false,
        message: "Budget plan not found",
        data: null,
      });
    }

    await budget_plan.update({
      is_deleted: true,
      deleted_by: req.user.id,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Budget plan deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error in delete budget plan:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};
