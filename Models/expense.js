import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import Project from "./project.js";
import Loan from "./loan.js";
import BankAccount from "./bank_account.js";
import Asset from "./asset.js";

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
        "Expense for returning external loan",
        "Expense for asset purchase",
        "Allowance expense",
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
      allowNull: true,
    },
    from_account: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "assets",
        key: "asset_id",
      },
    },
    receipt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Requested", "Approved", "Rejected", "Paid"),
      allowNull: false,
      defaultValue: "Requested",
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

Expense.belongsTo(Project, { foreignKey: "project_id", as: "for_project" });
Project.hasMany(Expense, { foreignKey: "project_id", as: "for_project" });

Expense.belongsTo(BankAccount, { foreignKey: "from_account", as: "expense_sender" });
BankAccount.hasMany(Expense, { foreignKey: "from_account", as: "expense_sender" });

Expense.belongsTo(Loan, { foreignKey: "loan_id", as: "for_loan" });
Loan.hasMany(Expense, { foreignKey: "loan_id", as: "for_loan" });

Expense.belongsTo(Asset, { foreignKey: "asset_id", as: "for_asset" });
Asset.hasMany(Expense, { foreignKey: "asset_id", as: "for_asset" });

export default Expense;

