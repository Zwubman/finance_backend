import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";

const IncomeSource = sequelize.define(
  "income_source",
  {
    income_source_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM("Sales", "Investments", "Other"),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    received_date: {
      type: DataTypes.DATE,
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
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "income_sources",
    timestamps: true,
    freezeTableName: true,
  }
);

IncomeSource.belongsTo(User, { foreignKey: "deleted_by"});
User.hasMany(IncomeSource, { foreignKey: "deleted_by" });

export default IncomeSource;