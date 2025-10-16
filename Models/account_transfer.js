import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import BankAccount from "./bank_account.js";
import User from "./user.js";

const AccountTransfer = sequelize.define(
  "account_transfer",
  {
    transfer_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    from_account: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "bank_accounts",
        key: "account_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    to_account: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "bank_accounts",
        key: "account_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    transfer_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receipt: {
      type: DataTypes.STRING,
      allowNull: false,
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
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "account_transfers",
    timestamps: true,
    freezeTableName: true,
  }
);

BankAccount.hasMany(AccountTransfer, { foreignKey: "from_account", as: "from_acc" });
AccountTransfer.belongsTo(BankAccount, { foreignKey: "from_account", as: "from_acc" });

BankAccount.hasMany(AccountTransfer, { foreignKey: "to_account", as: "to_acc" });
AccountTransfer.belongsTo(BankAccount, { foreignKey: "to_account", as: "to_acc" });

AccountTransfer.belongsTo(User, { foreignKey: "deleted_by", as: "deleted_by_user" });
User.hasMany(AccountTransfer, { foreignKey: "deleted_by", as: "deleted_transfers" });


export default AccountTransfer;
