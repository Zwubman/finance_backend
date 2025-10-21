import Employee from "../Models/employee.js";
import Project from "../Models/project.js";
import Expense from "../Models/expense.js";
import BankAccount from "../Models/bank_account.js";

/**
 * Create a new project
 */
export const createProject = async (req, res) => {
  try {
    const {
      project_name,
      start_date,
      expected_end_date,
      budget,
      total_estimated_cost,
      status,
      employee_id = [],
    } = req.body;

    // Validation
    if (!project_name || !start_date || !expected_end_date || !budget) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (new Date(start_date) > new Date(expected_end_date)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after expected end date",
      });
    }

    const allowedStatuses = ["Planned", "In Progress", "Completed", "On Hold"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    // Create project
    const project = await Project.create({
      project_name,
      start_date,
      expected_end_date,
      status: status || "Planned",
      budget: Number(budget),
      total_estimated_cost: Number(total_estimated_cost) || 0,
      assigned_to: employee_id,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error in createProject:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Get all projects
 */
export const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: projects } = await Project.findAndCountAll({
      where: { is_deleted: false },
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Get a project by ID
 */
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({
      where: { project_id: id, is_deleted: false },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error in getProjectById:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Update a project
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      project_name,
      start_date,
      expected_end_date,
      ended_at,
      status,
      budget,
      total_estimated_cost,
    } = req.body;

    const project = await Project.findOne({
      where: { project_id: id, is_deleted: false },
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const updateFields = {};
    if (project_name) updateFields.project_name = project_name;
    if (start_date) updateFields.start_date = start_date;
    if (expected_end_date) updateFields.expected_end_date = expected_end_date;
    if (ended_at) updateFields.ended_at = ended_at;
    if (status) updateFields.status = status;
    if (budget !== undefined) updateFields.budget = Number(budget);
    if (total_estimated_cost !== undefined)
      updateFields.total_estimated_cost = Number(total_estimated_cost);

    await project.update(updateFields);

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Soft delete a project
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({
      where: { project_id: id, is_deleted: false },
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    await project.update({
      is_deleted: true,
      deleted_by: req.user?.id || null,
      deleted_at: new Date(),
    });

    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const addProjectCostEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, amount, date, from_account } = req.body;

    if (!reason || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Both 'reason' and numeric 'amount' are required.",
      });
    }

    const project = await Project.findOne({
      where: { project_id: id, is_deleted: false },
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const from_acc = await BankAccount.findOne({
      where: { account_id: from_account, is_deleted: false },
    });

    if (!from_acc) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
    }

    // Correctly initialize structure
    const current = project.actual_cost || {
      total_actual_cost: 0,
      cost_details: [],
    };
    const details = Array.isArray(current.cost_details)
      ? [...current.cost_details]
      : [];

    let receipt = null;
    if (req.file) {
      receipt = `${req.protocol}://${req.get("host")}/${req.file.path.replace(
        /\\/g,
        "/"
      )}`;
    }

    // Create a cost entry
    const entry = {
      reason,
      amount: Number(amount),
      date: date || new Date(),
      receipt,
    };

    details.push(entry);
    const updatedActualCost = {
      total_actual_cost:
        Number(current.total_actual_cost || 0) + Number(amount),
      cost_details: details,
    };

    // Force Sequelize to see a new JSON reference
    project.set("actual_cost", updatedActualCost);

    await project.save(); // Different from project.update()

    await Expense.create({
      expense_reason: "Project expenses",
      specific_reason: `Project cost entry for project ID ${id}`,
      amount: Number(amount),
      expensed_date: date || new Date(),
      from_account: from_account,
      project_id: project.project_id,
      description: `Project cost - ${reason}`,
      receipt,
    });

    return res.status(200).json({
      success: true,
      message: "Cost entry added successfully",
      data: updatedActualCost,
    });
  } catch (error) {
    console.error("Error in addProjectCostEntry:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding cost entry",
      error: error.message,
    });
  }
};

/**
 * Add employee to project
 */
export const addEmployeeToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;

    const project = await Project.findOne({
      where: { project_id: id, is_deleted: false },
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const employee = await Employee.findOne({
      where: { employee_id, is_deleted: false },
    });
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });

    const assigned = new Set(project.assigned_to || []);
    assigned.add(Number(employee_id));

    await project.update({ assigned_to: [...assigned] });

    res.status(200).json({
      success: true,
      message: "Employee added successfully",
      data: project.assigned_to,
    });
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Remove employee from project
 */
export const removeEmployeeFromProject = async (req, res) => {
  try {
    const { id, employeeId } = req.params;

    const project = await Project.findOne({
      where: { project_id: id, is_deleted: false },
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const updated = (project.assigned_to || []).filter(
      (eid) => eid !== Number(employeeId)
    );
    await project.update({ assigned_to: updated });

    res.status(200).json({
      success: true,
      message: "Employee removed successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error removing employee:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
