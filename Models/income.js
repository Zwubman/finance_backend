import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import BankAccount from "./bank_account.js";
import Project from "./project.js";
import Loan from "./loan.js";

const Income = sequelize.define(
  "income",
  {
    income_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    income_source: {
      type: DataTypes.ENUM(
        "Software sales",
        "Subscription",
        "Support & maintenance contracts",
        "Training & workshops",
        "API usage charges",
        "Marketplace / app store income",
        "Project income",
        "Repaid from employee loan",
        "Income from loans",
        "Other"
      ),
      allowNull: false,
    },
    specific_source: {
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
    received_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    to_account: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "bank_accounts",
        key: "account_id",
      },
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
    tableName: "incomes",
    timestamps: true,
    freezeTableName: true,
  }
);

Income.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(Income, { foreignKey: "deleted_by" });

Income.belongsTo(BankAccount, { foreignKey: "to_account", as: "receiver" });
BankAccount.hasMany(Income, { foreignKey: "to_account", as: "receiver" });

Income.belongsTo(Project, { foreignKey: "project_id", as: "from_project" });
Project.hasMany(Income, { foreignKey: "project_id", as: "from_project" });

Income.belongsTo(Loan, { foreignKey: "loan_id", as : "from_loan" });
Loan.hasMany(Income, { foreignKey: "loan_id", as: "from_loan" });

export default Income;
