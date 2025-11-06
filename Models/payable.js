import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import Project from "./project.js";
import Loan from "./loan.js";
import BankAccount from "./bank_account.js";
import Asset from "./asset.js";

const Payable = sequelize.define(
  "payable",
  {
    payable_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    expense_reason: {
      type: DataTypes.ENUM(
        "Office & Administration",
        "Employee salary costs",
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
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      allowNull: false,
      defaultValue: "Pending",
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
    tableName: "payables",
    timestamps: true,
    freezeTableName: true,
  }
);

Payable.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(Payable, { foreignKey: "deleted_by" });

Payable.belongsTo(Project, { foreignKey: "project_id", as: "for_projects" });
Project.hasMany(Payable, { foreignKey: "project_id", as: "for_projects" });

Payable.belongsTo(Loan, { foreignKey: "loan_id", as: "for_loans" });
Loan.hasMany(Payable, { foreignKey: "loan_id", as: "for_loans" });

Payable.belongsTo(Asset, { foreignKey: "asset_id", as: "for_assets" });
Asset.hasMany(Payable, { foreignKey: "asset_id", as: "for_assets" });

export default Payable;

