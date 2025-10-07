import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import BankAccount from "./bank_account.js";


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
        "Marketplace / app store income"
      ),
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

Income.belongsTo(BankAccount, { foreignKey: "to_account" });
BankAccount.hasMany(Income, { foreignKey: "to_account" });

export default Income;
