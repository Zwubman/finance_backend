import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import BankAccount from "./bank_account.js";
import Employee from "./employee.js";

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
            key: "employee_id"
        }
    },
    period: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deduction: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    overtime: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    allowances: {
        type: DataTypes.DECIMAL,
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

Payroll.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(Payroll, { foreignKey: "deleted_by" });

Payroll.belongsTo(Employee, { foreignKey: "employee_id", as: "receiver" });
Employee.hasMany(Payroll, { foreignKey: "employee_id", as: "receiver" });

export default Payroll;
