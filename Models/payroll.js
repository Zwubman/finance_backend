import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import Employee from "./employee.js";
import Expense from "./expense.js";

const Payroll = sequelize.define(
  "payroll",
  {
    payroll_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employees",
        key: "employee_id",
      },
    },
    gross_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    deductions: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
    },
    net_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    pay_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Paid", "Cancelled"),
      allowNull: false,
      defaultValue: "Pending",
    },
    expense_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "expenses",
        key: "expense_id",
      },
    },
    recipient_file: {
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
    tableName: "payrolls",
    timestamps: true,
    freezeTableName: true,
  }
);

Payroll.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" });
Employee.hasMany(Payroll, { foreignKey: "employee_id", as: "payrolls" });

Payroll.belongsTo(Expense, { foreignKey: "expense_id", as: "expense" });
Expense.hasMany(Payroll, { foreignKey: "expense_id", as: "expense_payrolls" });

export default Payroll;
