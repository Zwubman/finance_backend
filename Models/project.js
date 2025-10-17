import { DataTypes } from "sequelize";
import sequelize from "../Config/database.js";
import User from "./user.js";

const Project = sequelize.define(
  "project",
  {
    project_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expected_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Planned", "In Progress", "Completed", "On Hold"),
      allowNull: false,
      defaultValue: "Planned",
    },

    // NEW numeric fields
    budget: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    total_estimated_cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    actual_cost: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        total_actual_cost: 0,
        cost_details: [],
      },
      validate: {
        isValidStructure(value) {
          if (
            typeof value !== "object" ||
            typeof value.total_actual_cost !== "number" ||
            !Array.isArray(value.cost_details)
          ) {
            throw new Error("Invalid structure for actual_cost");
          }
        },
      },
    },

    assigned_to: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("assigned_to must be an array");
          }
        },
      },
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "user_id" },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "projects",
    timestamps: true,
    freezeTableName: true,
  }
);

Project.belongsTo(User, { foreignKey: "deleted_by" });
User.hasMany(Project, { foreignKey: "deleted_by" });

export default Project;
