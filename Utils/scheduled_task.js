import cron from "node-cron";
import Project from "../Models/project.js";
import ProjectCost from "../Models/project_cost.js";
import ProjectEmployee from "../Models/project_employee.js";
import Employee from "../Models/employee.js";
import { Op } from "sequelize";

// Run every day at 12:00 AM (midnight)
cron.schedule("0 0 * * *", async ()  => {
    console.log("Running daily project cost update job...");

    try {
      // Get all ongoing projects (not completed and not deleted)
      const activeProjects = await Project.findAll({
        where: {
          completed_at: null,
          is_deleted: false,
        },
      });

      for (const project of activeProjects) {
        const projectId = project.project_id;

        // Get assigned employees for this project
        const assignedEmployees = await ProjectEmployee.findAll({
          where: { project_id: projectId },
          include: [{ model: Employee, attributes: ["salary"] }],
        });

        if (assignedEmployees.length === 0) continue;

        // Calculate total daily salary cost
        let totalDailyCost = 0;
        for (const pe of assignedEmployees) {
          const monthlySalary = pe.employee?.salary || 0;
          totalDailyCost += monthlySalary / 30; 
        }

        const projectCost = await ProjectCost.findOne({
          where: {
            project_id: projectId,
            is_deleted: false,
            actual_cost: { [Op.ne]: null },
          },
        });

        if (projectCost) {
          const previousActualCost = Number(projectCost.actual_cost) || 0;
          const newActualCost = previousActualCost + totalDailyCost;

          const previous_employee_salary_cost =
            Number(projectCost.employee_salary_cost) || 0;
          const new_employee_salary_cost =
            previous_employee_salary_cost + totalDailyCost;

          await projectCost.update({
            actual_cost: newActualCost,
            employee_salary_cost: new_employee_salary_cost,
          });

          console.log(
            `Project ID ${projectId}: actual_cost updated to ${newActualCost.toFixed(
              2
            )}`
          );
        } else {
          await ProjectCost.create({
            project_id: projectId,
            actual_cost: totalDailyCost,
            employee_salary_cost: totalDailyCost,
          });

          console.log(
            `Project ID ${projectId}: new cost record created with initial cost ${totalDailyCost.toFixed(
              2
            )}`
          );
        }
      }

      console.log("Daily project cost update job completed.");
    } catch (error) {
      console.error("Error updating project actual cost:", error.message);
    }
  },
  {
    scheduled: true,
    timezone: "Africa/Addis_Ababa", 
  }
);
