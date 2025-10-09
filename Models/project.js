import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";

const Project = sequelize.define(
  "project",
  {
    project_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expected_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    budget: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    actual_cost: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0,
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
    total_estimated_cost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("Planned", "In Progress", "Completed", "On Hold"),
      allowNull: false,
      defaultValue: "Planned",
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
    tableName: "projects",
    timestamps: true,
    freezeTableName: true,
  }
);

Project.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(Project, { foreignKey: "deleted_by" });

export default Project;
