import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import Employee from "./employee.js";

const Loan = sequelize.define(
  "loan",
  {
    loan_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    to_who: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employees",
        key: "employee_id",
      },
    },
    from_whom: { // bank name who provide the loan to our company
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    interest_rate: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    penalty: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Given", "Received", "Returned"),
      allowNull: false,
    },
    receipt: {
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
    tableName: "loans",
    timestamps: true,
    freezeTableName: true,
  }
);

Loan.belongsTo(Employee, { foreignKey: "to_who", as: "borrower" });
Employee.hasMany(Loan, { foreignKey: "to_who" });

Loan.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(Loan, { foreignKey: "deleted_by" });

export default Loan;
