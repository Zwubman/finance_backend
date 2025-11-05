import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";
import Project from "./project.js";
import Loan from "./loan.js";
import Asset from "./asset.js";

const Receivable = sequelize.define(
  "receivable",
  {
    receivable_id: {
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
        "Income from asset sales",
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
      type: DataTypes.ENUM("Pending", "Rejected", "Approved"),
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
    tableName: "receivables",
    timestamps: true,
    freezeTableName: true,
  }
);

Receivable.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(Receivable, { foreignKey: "deleted_by" });

Receivable.belongsTo(Project, { foreignKey: "project_id", as: "from_projects" });
Project.hasMany(Receivable, { foreignKey: "project_id", as: "from_projects" });

Receivable.belongsTo(Loan, { foreignKey: "loan_id", as: "from_loans" });
Loan.hasMany(Receivable, { foreignKey: "loan_id", as: "from_loans" });

Receivable.belongsTo(Asset, { foreignKey: "asset_id", as: "from_assets" });
Asset.hasMany(Receivable, { foreignKey: "asset_id", as: "from_assets" });    

export default Receivable;
