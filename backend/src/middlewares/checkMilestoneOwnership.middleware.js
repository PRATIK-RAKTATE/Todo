import { Milestone } from "../models/assigner.model.js";
import mongoose from 'mongoose';

export const checkMilestoneOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log('Received ID:', id);
    console.log('ID validation result:', mongoose.Types.ObjectId.isValid(id));

    // Validate ID format first
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid milestone ID format',
        providedId: id 
      });
    }

    const milestone = await Milestone.findById(id);

    if (!milestone) {
      return res.status(404).json({ 
        success: false,
        error: 'Milestone not found' 
      });
    }

    // Make sure req.user exists and has _id
    if (!req.user?._id) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Compare using toString() for ObjectId comparison
    if (milestone.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Only the creator can modify this milestone' 
      });
    }

    req.milestone = milestone;
    next();
  } catch (error) {
    console.error('Milestone ownership check error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
