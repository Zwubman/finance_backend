import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import e from "express";

const Expense = sequelize.define(
  "expense",
  {
    expense_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM("Office Supplies", "Travel", "Utilities", "Other"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    expensed_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
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
    tableName: "expenses",
    timestamps: true,
    freezeTableName: true,
  }
);

Expense.belongsTo(User, { foreignKey: "deleted_by"});
User.hasMany(Expense, { foreignKey: "deleted_by" });

export default Expense;