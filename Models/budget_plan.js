import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";

const BudgetPlan = sequelize.define(
  "budget_plan",
  {
    budget_plan_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    planned_income: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    planned_expense: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    actual_income: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0,
    },
    actual_expense: {
      type: DataTypes.DECIMAL,
      allowNull: true,
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
    tableName: "budget_plans",
    timestamps: true,
    freezeTableName: true,
  }
);

BudgetPlan.belongsTo(User, { foreignKey: "deleted_by"});
User.hasMany(BudgetPlan, { foreignKey: "deleted_by" });

export default BudgetPlan;