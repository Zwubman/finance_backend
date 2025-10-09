import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import Project from "./project.js";
import Loan from "./loan.js";
import BankAccount from "./bank_account.js";

const Expense = sequelize.define(
  "expense",
  {
    expense_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    expense_reason: {
      type: DataTypes.ENUM(
        "Office & Administration",
        "Employee Costs",
        "Technology and infrastructure",
        "Sales & Marketing",
        "Finance & Legal",
        "Travel & Miscellaneous",
        "Project expenses",
        "Expense for employee loan",
        "Repaid for loan expense",
        "Other"
      ),
      allowNull: false,
    },
    specific_reason: {
      type: DataTypes.STRING,
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
    from_account: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "bank_accounts",
        key: "account_id",
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "projects",
        key: "project_id",
      },
    },
    loan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "loans",
        key: "loan_id",
      },
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
    tableName: "expenses",
    timestamps: true,
    freezeTableName: true,
  }
);

Expense.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(Expense, { foreignKey: "deleted_by" });

Expense.belongsTo(Project, { foreignKey: "project_id" });
Project.hasMany(Expense, { foreignKey: "project_id" });

Expense.belongsTo(BankAccount, { foreignKey: "from_account" });
BankAccount.hasMany(Expense, { foreignKey: "from_account" });

Expense.belongsTo(Loan, { foreignKey: "loan_id" });
Loan.hasMany(Expense, { foreignKey: "loan_id" });

export default Expense;
