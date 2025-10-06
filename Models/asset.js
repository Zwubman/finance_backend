import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";

const Asset = sequelize.define(
  "asset",
  {
    asset_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("Electronics", "Furniture", "Vehicle", "Other"),
      allowNull: false,
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    cost: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    vendor: {
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
    tableName: "assets",
    timestamps: true,
    freezeTableName: true,
  }
);

Asset.belongsTo(User, { foreignKey: "deleted_by"});
User.hasMany(Asset, { foreignKey: "deleted_by" });

export default Asset;