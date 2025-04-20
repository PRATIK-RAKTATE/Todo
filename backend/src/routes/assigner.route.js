import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { checkMilestoneOwnership } from '../middlewares/checkMilestoneOwnership.middleware.js';
import {
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
} from '../controllers/assigner.controller.js';

const router = express.Router();
router.use(verifyJWT);

router.route('/')
  .get(getAllTasks)         
  .post(assignTask);        
  
router.route('/me')
  .get(getTasksAcceptedByUser) // task accepted by usr

router.route('/milestone')
  .post(verifyJWT, createMilestone)
  .get(verifyJWT, getAllMilestones);

router.route('/milestone/:id')
  .patch(checkMilestoneOwnership, updateMilestone)
  .delete(checkMilestoneOwnership, deleteMilestone);

router.route('/me/completed') 
  .get(getMyCompletedTasks)
  
  
router.route('/completed/all') 
  .get(getAllCompletedTasks)

router.route('/:id/comments')  
  .get(getComments)
  .post(addComment)
 
router.route('/:id')
  .get(getTaskById)// by task id      
  .patch(editTask)           
  .delete(deleteTask);       

// assinged by user
router.route('/all/assigned')
  .get(getAssignedTasks)


router.post('/:id/accept', acceptTask);         
router.post('/:id/reassign', reassignTask);     
router.post('/:id/complete', markComplete);     
router.post('/:id/approve', approveCompletion); 



export default router;
