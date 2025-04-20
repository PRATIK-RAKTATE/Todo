import mongoose, { Schema } from "mongoose";

const inviteAndRequestSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    abstractId: {
        type: Schema.Types.ObjectId,
        ref: "Abstract"
    },
    type: {
        type: String,
        enum: ['invite', 'request'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: "Group"
    },


},
    {
        timestamps: true
    });

export const InviteAndRequest = mongoose.model("InviteAndRequest", inviteAndRequestSchema)
