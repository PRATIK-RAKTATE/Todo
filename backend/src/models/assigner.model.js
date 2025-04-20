import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    assigner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "inProgress", "completed", "approved"],
      default: "pending",
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    completedAt: {
      type: Date,
    },
    
    remark: {
      type: String,
      trim: true,
    },
    previousAssignments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        reassignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        content: {
          type: String,
          required: [true, "Comment  required"],
          trim: true,
        },
        commentedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
        },
      },
    ],
  },

  { timestamps: true }  
);

const milestoneSchema = new Schema(
  {
    milestone: {
      type: String,
      required: [true, "Milestone text is required"],
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }  
);

// Add a pre-save hook to handle sequence updates
milestoneSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastMilestone = await this.constructor.findOne({}, {}, { sort: { sequence: -1 } });
    this.sequence = lastMilestone ? lastMilestone.sequence + 1 : 1;
  }
  next();
});

export const Task = mongoose.model("Task", taskSchema);
export const Milestone = mongoose.model("Milestone", milestoneSchema);
