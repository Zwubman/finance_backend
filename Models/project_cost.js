import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import Project from "./project.js";

const ProjectCost = sequelize.define(
  "project_cost",
  {
    project_cost_id: {
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
    employee_salary_cost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    requirement_gathering_cost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    allowance_cost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    purchase_cost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    advisor_cost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    other_cost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    description_for_other_cost: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receipt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    total_cost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "project_costs",
    timestamps: true,
    freezeTableName: true,
  }
);

ProjectCost.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(ProjectCost, { foreignKey: "deleted_by" });

ProjectCost.belongsTo(Project, { foreignKey: "project_id" });
Project.hasMany(ProjectCost, { foreignKey: "project_id" });

export default ProjectCost;
