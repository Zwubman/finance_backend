import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";

const BankAccount = sequelize.define(
  "bank_account",
  {
    account_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    account_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    account_type: {
      type: DataTypes.ENUM("Checking", "Savings", "Credit"),
      allowNull: false,
    },
    bank_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    account_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0.0,
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
    tableName: "bank_accounts",
    timestamps: true,
    freezeTableName: true,
  }
);

BankAccount.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(BankAccount, { foreignKey: "deleted_by" });

export default BankAccount;