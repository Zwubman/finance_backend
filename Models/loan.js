import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";

const Loan = sequelize.define(
  "loan",
  {
    loan_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    borrower_name: {
      type: DataTypes.STRING,
      allowNull: false,
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
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Paid"),
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
    tableName: "loans",
    timestamps: true,
    freezeTableName: true,
  }
);

Loan.belongsTo(User, { foreignKey: "deleted_by"});
User.hasMany(Loan, { foreignKey: "deleted_by" });

export default Loan;