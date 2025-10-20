import cron from "node-cron";
import Project from "../Models/project.js";
import Employee from "../Models/employee.js";
import { Op } from "sequelize";

// Run every minute for testing (change to 0 0 * * * for daily)
cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("Running daily project cost update job...");

    try {
      // Fetch all ongoing projects
      const active_projects = await Project.findAll({
        where: {
          completed_at: null,
          is_deleted: false,
        },
      });

      for (const project of active_projects) {
        const assigned_employees = project.assigned_to || [];

        if (assigned_employees.length === 0) continue;

        // Fetch all assigned employees' salaries
        const employees = await Employee.findAll({
          where: { employee_id: { [Op.in]: assigned_employees } },
          attributes: ["employee_id", "salary"],
        });

        // Calculate total daily salary
        let total_daily_cost = 0;
        employees.forEach((emp) => {
          const monthly_salary = emp.salary || 0;
          total_daily_cost += monthly_salary / 30; // daily rate
        });

        // Extract existing actual cost info
        const actual_cost_data = project.actual_cost || {
          total_actual_cost: 0,
          cost_details: [],
        };

        const previous_total = Number(actual_cost_data.total_actual_cost || 0);
        const new_total = previous_total + total_daily_cost;

        // Append daily record to cost_details
        const new_cost_entry = {
          date: new Date().toISOString().split("T")[0],
          daily_salary_cost: total_daily_cost,
          description: "Daily employee salary cost update",
        };

        // Update actual_cost
        const updated_actual_cost = {
          ...actual_cost_data,
          total_actual_cost: new_total,
          cost_details: [...actual_cost_data.cost_details, new_cost_entry],
        };

        await project.update({
          actual_cost: JSON.parse(JSON.stringify(updated_actual_cost)), // Force update
        });

        console.log(
          `Project ID ${
            project.project_id
          }: total_actual_cost updated to ${new_total.toFixed(2)}`
        );
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
