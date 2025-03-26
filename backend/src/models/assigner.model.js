import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },
    assigner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "inProgress", "completed", "approved", "rejected"],
      default: "pending"
    },
    remarks: {
      type: String,
      trim: true
    },
    previousAssignments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        reassignedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    dueDate: {
      type: Date,
      required: [true, "Due date is required"]
    },
    comments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        message: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
