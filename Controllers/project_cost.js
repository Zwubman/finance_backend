import Project from "../Models/project.js";
import ProjectCost from "../Models/project_cost.js";

export const createProjectCost = async (req, res) => {
  try {
    const {
      requirement_gathering_cost,
      allowance_cost,
      purchase_cost,
      advisor_cost,
      other_cost,
      description_for_other_cost,
    } = req.body;
    const project_id = req.params.id;

    if (other_cost) {
      if (!description_for_other_cost) {
        return res.status(400).json({
          success: false,
          message:
            "Description for other cost is required when other cost is provided",
          data: null,
        });
      }
    }

    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        data: null,
      });
    }

    const project_cost = await ProjectCost.create({
      project_id,
      requirement_gathering_cost,
      allowance_cost,
      purchase_cost,
      advisor_cost,
      other_cost,
      description_for_other_cost,
    });

    return res.status(201).json({
      success: true,
      message: "Project cost created successfully",
      data: project_cost,
    });
  } catch (error) {
    console.error("Error in create project cost:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getProjectCostByProjectId = async (req, res) => {
  try {
    const id = req.params.id;
    const project_cost = await ProjectCost.findAll({
      where: { project_id: id, is_deleted: false },
    });

    if (!project_cost) {
      return res.status(404).json({
        success: false,
        message: "Project cost not found for the given project ID",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project cost retrieved successfully",
      data: project_cost,
    });
  } catch (error) {
    console.error("Error in get project cost by project id:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getProjectCostById = async (req, res) => {
  try {
    const { id } = req.params;
    const project_cost = await ProjectCost.findOne({
      where: { project_cost_id: id, is_deleted: false },
    });

    if (!project_cost) {
      return res.status(404).json({
        success: false,
        message: "Project cost not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project cost retrieved successfully",
      data: project_cost,
    });
  } catch (error) {
    console.error("Error in get project cost by id:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getAllProjectCosts = async (req, res) => {
  try {
    const project_costs = await ProjectCost.findAll({
      where: { is_deleted: false },
    });

    if (project_costs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No project costs found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project costs retrieved successfully",
      data: project_costs,
    });
  } catch (error) {
    console.error("Error in get all project costs:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const updateProjectCost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      requirement_gathering_cost,
      allowance_cost,
      purchase_cost,
      advisor_cost,
      other_cost,
      description_for_other_cost,
    } = req.body;

    const project_cost = await ProjectCost.findOne({
      where: { project_cost_id: id, is_deleted: false },
    });

    if (!project_cost) {
      return res.status(404).json({
        success: false,
        message: "Project cost not found",
        data: null,
      });
    }

    if (other_cost !== undefined) {
      if (other_cost && !description_for_other_cost) {
        return res.status(400).json({
          success: false,
          message:
            "Description for other cost is required when other cost is provided",
          data: null,
        });
      }
    }

    const to_update = {};

    if (requirement_gathering_cost)
      to_update.requirement_gathering_cost = requirement_gathering_cost;
    if (allowance_cost) to_update.allowance_cost = allowance_cost;
    if (purchase_cost) to_update.purchase_cost = purchase_cost;
    if (advisor_cost) to_update.advisor_cost = advisor_cost;
    if (other_cost !== undefined) to_update.other_cost = other_cost;
    if (description_for_other_cost)
      to_update.description_for_other_cost = description_for_other_cost;

    await project_cost.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Project cost updated successfully",
      data: project_cost,
    });
  } catch (error) {
    console.error("Error in update project cost:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const deleteProjectCost = async (req, res) => {
  try {
    const { id } = req.params;

    const project_cost = await ProjectCost.findOne({
      where: { project_cost_id: id, is_deleted: false },
    });

    if (!project_cost) {
      return res.status(404).json({
        success: false,
        message: "Project cost not found",
        data: null,
      });
    }

    await project_cost.update({
      is_deleted: true,
      deleted_by: req.user.id,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Project cost deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error in delete project cost:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};
