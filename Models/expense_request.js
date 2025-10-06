import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";

const ExpenseRequest = sequelize.define(
  "expense_request",
  {
    request_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    place_of_origin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    place_to_travel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    departure_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    arrival_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    split_transportation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paid_transportation: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    number_of_days_not_paid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    route_transport: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_transport: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    travel_purpose: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    detailed_activities: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    number_of_days_allowance_paid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    daily_allowance: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    total_allowance: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    total_transport_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    allowance_receipt: {
      type: DataTypes.STRING, // Could be a filename or receipt number
      allowNull: true,
    },
    bank_account_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
  },
  {
    tableName: "expense_requests",
    timestamps: true,
    freezeTableName: true,
  }
);

ExpenseRequest.belongsTo(User, { as: "requester", foreignKey: "requested_by" });
ExpenseRequest.belongsTo(User, { as: "verifier", foreignKey: "verified_by" });
ExpenseRequest.belongsTo(User, { as: "approver", foreignKey: "approved_by" });

User.hasMany(ExpenseRequest, {
  as: "requestedExpenses",
  foreignKey: "requested_by",
});
User.hasMany(ExpenseRequest, {
  as: "verifiedExpenses",
  foreignKey: "verified_by",
});
User.hasMany(ExpenseRequest, {
  as: "approvedExpenses",
  foreignKey: "approved_by",
});

export default ExpenseRequest;
