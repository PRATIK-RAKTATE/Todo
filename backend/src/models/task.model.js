import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema({
    groupId: {
        type: Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    to: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: [ 'pending', 'inProgress', 'completed' ],
        default: 'pending'
    },
},
    {
        timestamps: true
    });

export const Task = mongoose.model("Task", taskSchema)
