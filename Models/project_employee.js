import { DataTypes, INTEGER } from "sequelize";
import sequelize from "../Config/database.js";
import Project from "./project.js";
import Employee from "./employee.js";

const ProjectEmployee = sequelize.define(
  "project_employee",
  {
    project_employee_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "projects",
        key: "project_id",
      },
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employees",
        key: "employee_id",
      },
    },
  },
  {
    tableName: "project_employees",
    timestamps: true,
    freezeTableName: true,
  }
);

ProjectEmployee.belongsTo(Project, { foreignKey: "project_id" });
Project.hasMany(ProjectEmployee, { foreignKey: "project_id" });

ProjectEmployee.belongsTo(Employee, { foreignKey: "employee_id" });
Employee.hasMany(ProjectEmployee, { foreignKey: "employee_id" });

export default ProjectEmployee;