import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import Expense from "./expense.js";
import Income from "./income.js";
import Loan from "./loan.js";
import Project from "./project.js";

const Transaction = sequelize.define(
  "transaction",
  {
    transaction_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM("Income", "Expense"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bank_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "bank_accounts",
        key: "account_id",
      },
    },
    income_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "income_sources",
        key: "income_source_id",
      },
    },
    expense_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "expenses",
        key: "expense_id",
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
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "projects",
        key: "project_id",
      },
    },
    receipt: {
          type: DataTypes.STRING, 
          allowNull: true,
        },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
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
    tableName: "transactions",
    timestamps: true,
    freezeTableName: true,
  }
);

Transaction.belongsTo(User, { foreignKey: "deleted_by"});
User.hasMany(Transaction, { foreignKey: "deleted_by" });

Transaction.belongsTo(Expense, { foreignKey: "expense_id" });
Expense.hasMany(Transaction, { foreignKey: "expense_id" });

Transaction.belongsTo(Income, { foreignKey: "income_id" });
Income.hasMany(Transaction, { foreignKey: "income_id" });

Transaction.belongsTo(Loan, { foreignKey: "loan_id" });
Loan.hasMany(Transaction, { foreignKey: "loan_id" });

Transaction.belongsTo(Project, { foreignKey: "project_id" });
Project.hasMany(Transaction, { foreignKey: "project_id" });

Transaction.belongsTo(User, { foreignKey: "approved_by" });
User.hasMany(Transaction, { foreignKey: "approved_by" });

export default Transaction;