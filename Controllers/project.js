import Project from "../Models/project.js";

export const createProject = async (req, res) => {
  try {
    const { project_name, start_date, end_date, budget, actual_cost, status } =
      req.body;

    // validation
    if (!project_name || !start_date || !end_date || !budget) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    if (status) {
      if (
        !["Planned", "In Progress", "Completed", "On Hold"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
          data: null,
        });
      }
    }

    const project = await Project.create({
      project_name,
      start_date,
      end_date,
      budget,
      actual_cost: actual_cost || 0,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error in create project:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

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
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error in get project by id:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({ where: { is_deleted: false } });

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No projects found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  } catch (error) {
    console.error("Error in get all projects:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", Error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, start_date, end_date, status, budget, actual_cost } =
      req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
        data: null,
      });
    }

    const project = await Project.findOne({
      where: {
        project_id: id,
        is_deleted: false,
      },
    });

    const to_update = {};

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        data: null,
      });
    }

    if (status) {
      if (
        !["Planned", "In Progress", "Completed", "On Hold"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
          data: null,
        });
      }
      to_update.status = status;
    }

    if (project_name) to_update.project_name = project_name;
    if (start_date) to_update.start_date = start_date;
    if (end_date) to_update.end_date = end_date;
    if (budget) to_update.budget = budget;
    if (actual_cost) to_update.actual_cost = actual_cost;

    await project.update(to_update);

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
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

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      where: {
        project_id: id,
        is_deleted: false,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        data: null,
      });
    }

    await project.update({
      is_deleted: true,
      deleted_by: req.user.id,
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
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
