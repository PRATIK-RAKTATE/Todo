import mongoose from 'mongoose';
import { User } from "../models/user.model.js";
import { Task } from "../models/assigner.model.js";
import { Milestone } from "../models/assigner.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Assign a Task
const assignTask = async (req, res) => {
  try {
    const { title, description, receiverId, deadline, remark } = req.body;
    const assignerId = req.user.id;

    // Validate required fields
    if (!title || !description || !receiverId || !deadline) {
      return res.status(400).json({
        message: "Required fields: title, description, receiverId, deadline",
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Validate deadline is a future date
    if (new Date(deadline) < new Date()) {
      return res.status(400).json({
        message: "Deadline must be a future date",
      });
    }

    // Create task document
    const task = new Task({
      title,
      description,
      assigner: assignerId,
      receiver: receiverId,
      deadline,
      remark: remark || undefined,
    });

    await task.save();

    res.status(201).json({
      message: "Task assigned successfully",
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().slice(0, 10)
          : null,
        assigner: assignerId,
        receiver: receiverId,
        remark: task.remark,
      },
    });
  } catch (error) {
    console.error("Error assigning task:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//accept Task (Receiver)
const acceptTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    //check if the current user is the assigned receiver
    if (task.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    task.status = "inProgress";
    await task.save();

    res.json({ message: "Task accepted", task });
  } catch (error) {
    console.error("Error accepting task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// edit task assigner only
const editTask = async (req, res) => {
  try {
    // auth check
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { title, description, remark, deadline } = req.body;

    // Validate task ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    // find task and who is assigner
    const task = await Task.findOne({
      _id: id,
      assigner: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or you don't have permission to edit it",
      });
    }

    //updates
    const updates = {};
    const allowedFields = ["title", "description", "remark", "deadline"];

    // validate and prepare updates
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === "string") {
          updates[field] = req.body[field].trim();

          // Check for empty strings after trim
          if (!updates[field]) {
            return res.status(400).json({
              message: `${field} cannot be empty`,
            });
          }
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    // validation for deadline
    if (updates.deadline) {
      const newDeadline = new Date(updates.deadline);
      if (isNaN(newDeadline)) {
        return res.status(400).json({ message: "Invalid deadline format" });
      }
      if (newDeadline < new Date()) {
        return res
          .status(400)
          .json({ message: "Deadline must be in the future" });
      }
      updates.deadline = newDeadline;
    }

    // update task with validation
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
        select: "-__v -previousAssignments",
      }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task updated successfully",
      task: updatedTask.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("Error editing task:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // handle specific error types
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid data format",
        field: error.path,
      });
    }

    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//delete Task (Only assigner)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.assigner.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//reassign Task (Only assigner)
const reassignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { newReceiverId } = req.body;
    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.assigner.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    task.receiver = newReceiverId;
    task.status = "pending";
    await task.save();

    res.json({ message: "Task reassigned", task });
  } catch (error) {
    console.error("Error reassigning task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//mark as Complete (Receiver)
const markComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    task.status = "completed";
    await task.save();

    res.json({ message: "Task marked as complete", task });
  } catch (error) {
    console.error("Error marking task complete:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//approve Completion (only assigner)
const approveCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark, isApproved } = req.body;
    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.assigner.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    task.status = isApproved ? "approved" : "approved";
    task.remark = remark;
    await task.save();

    res.json({
      message: isApproved ? "Task approved" : "Task marked as incomplete",
      task,
    });
  } catch (error) {
    console.error("Error approving task completion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Get on all tasks for the current user (
const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    //validate user id format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    //find tasks with pagination,filtering
    const tasks = await Task.find({
      $or: [{ assigner: userId }, { receiver: userId }],
    })
      .populate("assigner", "name email _id")
      .populate("receiver", "name email _id")
      .select("-__v") //exclude version key
      .sort({ createdAt: -1 })
      .lean();

    //transform tasks for better client-side consumption
    const transformedTasks = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      deadline: task.deadline,
      assigner: {
        id: task.assigner._id,
        name: task.assigner.name,
        email: task.assigner.email,
      },
      receiver: {
        id: task.receiver._id,
        name: task.receiver.name,
        email: task.receiver.email,
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: transformedTasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//get task by id of task
const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    //validate IDs format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID format",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    //Find the task
    const task = await Task.findById(taskId)
      .populate("assigner", "name email _id")
      .populate("receiver", "name email _id")
      .select("-__v");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check authorization
    const isAuthorized = [task.assigner._id, task.receiver._id].some((id) =>
      id.equals(userId)
    );

    const transformedTask = {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      deadline: task.deadline,
      assigner: {
        id: task.assigner._id,
        name: task.assigner.name,
        email: task.assigner.email,
      },
      receiver: {
        id: task.receiver._id,
        name: task.receiver.name,
        email: task.receiver.email,
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: transformedTask,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//get task by user
const getTasksAcceptedByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    //validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    //find tasks where the user is the receiver and the task is in progress
    const tasks = await Task.find({
      receiver: userId,
      status: "inProgress", //glter for accepted tasks
    })
      .populate("assigner", "name email _id")
      .populate("receiver", "name email _id")
      .select("-__v")
      .sort({ createdAt: -1 });

    //transform tasks for better client-side consumption
    const transformedTasks = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      deadline: task.deadline
        ? new Date(task.deadline).toISOString().slice(0, 10)
        : null, // Format deadline
      assigner: {
        id: task.assigner._id,
        name: task.assigner.name,
        email: task.assigner.email,
      },
      receiver: {
        id: task.receiver._id,
        name: task.receiver.name,
        email: task.receiver.email,
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: transformedTasks.length,
      data: transformedTasks,
    });
  } catch (error) {
    console.error("Error fetching accepted tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getMyCompletedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      receiver: req.user.id, //tasks assigned to user
      status: "completed", //only completed
      completedAt: { $exists: true }, //ensure completion
    })

      .select("title deadline status _id assigner receiver completedAt")

      .populate("assigner", "name") //only get assigner name
      .populate("receiver", "name") //only get receiver name

      .sort({ completedAt: -1 })
      // to increase performance
      .lean();

    // transform data
    const formattedTasks = tasks.map((task) => ({
      Title: task.title,
      Deadline: task.deadline,
      Status: task.status,
      TaskId: task._id.toString(),
      To: task.receiver?.name || "Unknown",
      From: task.assigner?.name || "Unknown",
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching completed tasks:`,
      error
    );

    res.status(500).json({
      message: "Failed to fetch completed tasks",
      error: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

const getAllCompletedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ status: "completed" })
      .select("title deadline status _id assigner receiver")
      .populate("assigner", "name email")
      .populate("receiver", "name email")
      .sort({ completedAt: -1 });

    res.json(
      tasks.map((task) => ({
        Title: task.title,
        Deadline: task.deadline,
        Status: task.status,
        TaskId: task._id,
        To: task.receiver.name,
        From: task.assigner.name,
      }))
    );
  } catch (error) {
    console.error("Error fetching all completed tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assigner: req.user.id, // tasks assigned by current user
    })
      .select("title deadline status _id receiver")
      .populate("receiver", "name") // get receiver's name
      .sort({ deadline: -1 })
      .lean();

    const formattedTasks = tasks.map((task) => ({
      Title: task.title,
      Deadline: task.deadline,
      Status: task.status,
      TaskId: task._id.toString(),
      To: task.receiver?.name || "Unknown User",
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Assigned tasks error:`, error);
    res.status(500).json({
      message: "Failed to fetch assigned tasks",
      error: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

// comments
const addComment = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Comment content is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Add new comment
    const newComment = {
      content,
      commentedBy: userId,
    };

    task.comments.push(newComment);
    const savedTask = await task.save();

    // Populate user details in the response
    const populatedTask = await Task.populate(savedTask, {
      path: "comments.commentedBy",
      select: "name email",
    });

    const addedComment = populatedTask.comments[savedTask.comments.length - 1];

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: addedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message,
    });
  }
};

const getComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .select("comments")
      .populate("comments.commentedBy", "name email");

    if (!task) {
      return res.status(404).json(new ApiError(404, null, "Task not found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, { comments: task.comments }, "Comments retrieved")
      );
  } catch (error) {
    throw new ApiError(500, `Error fetching comments: ${error.message}`);
  }
};

const createMilestone = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User:', req.user);  // Check if user data is available
    
    const { milestone } = req.body;
    
    console.log('Milestone text:', milestone);
    
    // Validate milestone text
    if (!milestone?.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Milestone text is required' 
      });
    }

    // Get total count for sequence calculation
    const totalMilestones = await Milestone.countDocuments();
    const newSequence = totalMilestones + 1;

    // Create new milestone
    const newMilestone = new Milestone({
      milestone: milestone.trim(),
      createdBy: req.user._id,  // Make sure req.user._id exists
      sequence: newSequence
    });

    const savedMilestone = await newMilestone.save();
    await savedMilestone.populate('createdBy', 'name email');

    console.log('Saved milestone:', savedMilestone);
    
    return res.status(201).json({
      success: true,
      data: {
        id: savedMilestone._id,
        milestone: savedMilestone.milestone,
        sequence: savedMilestone.sequence,
        createdBy: {
          id: savedMilestone.createdBy._id.toString(),
          name: savedMilestone.createdBy.name,
          email: savedMilestone.createdBy.email
        },
        createdAt: savedMilestone.createdAt.toISOString(),
        canEdit: true
      }
    });

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAllMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find()
      .sort({ sequence: 1 })
      .populate('createdBy', 'name email');

    const formattedMilestones = milestones.map((milestone) => ({
      id: milestone._id,
      milestone: milestone.milestone,
      sequence: milestone.sequence,
      createdBy: {
        id: milestone.createdBy?._id.toString(),
        name: milestone.createdBy?.name,
        email: milestone.createdBy?.email
      },
      createdAt: milestone.createdAt.toISOString(),
      canEdit: milestone.createdBy?._id.toString() === req.user.id
    }));

    res.status(200).json(formattedMilestones);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateMilestone = async (req, res) => {
  try {
    const { milestone, newSequence } = req.body;
    const existingMilestone = req.milestone; 

    if (!milestone && newSequence === undefined) {
      return res.status(400).json({ 
        error: 'Either milestone text or sequence must be provided' 
      });
    }

    if (newSequence !== undefined) {
      const maxSequence = await Milestone.countDocuments();
      if (newSequence < 1 || newSequence > maxSequence) {
        return res.status(400).json({ error: 'Invalid sequence number' });
      }

      // Update other milestones' sequences
      if (newSequence > existingMilestone.sequence) {
        await Milestone.updateMany(
          { 
            sequence: { 
              $gt: existingMilestone.sequence, 
              $lte: newSequence 
            } 
          },
          { $inc: { sequence: -1 } }
        );
      } else if (newSequence < existingMilestone.sequence) {
        await Milestone.updateMany(
          { 
            sequence: { 
              $gte: newSequence, 
              $lt: existingMilestone.sequence 
            } 
          },
          { $inc: { sequence: 1 } }
        );
      }

      existingMilestone.sequence = newSequence;
    }

    if (milestone) {
      if (!milestone.trim()) {
        return res.status(400).json({ error: 'Milestone text cannot be empty' });
      }
      existingMilestone.milestone = milestone.trim();
    }

    const updatedMilestone = await existingMilestone.save();
    await updatedMilestone.populate('createdBy', 'name email');

    return res.json({
      id: updatedMilestone._id,
      milestone: updatedMilestone.milestone,
      sequence: updatedMilestone.sequence,
      createdBy: {
        id: updatedMilestone.createdBy._id.toString(),
        name: updatedMilestone.createdBy.name,
        email: updatedMilestone.createdBy.email
      },
      createdAt: updatedMilestone.createdAt.toISOString(),
      canEdit: true
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteMilestone = async (req, res) => {
  try {
    const milestone = req.milestone; 
    if (!milestone) {
      return res.status(404).json({ 
        success: false,
        error: 'Milestone not found' 
      });
    }

    // update sequences of remaining milestones
    await Milestone.updateMany(
      { sequence: { $gt: milestone.sequence } },
      { $inc: { sequence: -1 } }
    );

    await milestone.deleteOne();

    return res.status(200).json({ 
      success: true,
      message: 'Milestone deleted successfully',
      deletedMilestoneId: milestone._id
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  assignTask,
  acceptTask,
  editTask,
  deleteTask,
  reassignTask,
  markComplete,
  approveCompletion,
  getAllTasks,
  getTaskById,
  getTasksAcceptedByUser,
  getMyCompletedTasks,
  getAllCompletedTasks,
  getAssignedTasks,
  getComments,
  addComment,
  createMilestone,
  getAllMilestones,
  updateMilestone,
  deleteMilestone
}
