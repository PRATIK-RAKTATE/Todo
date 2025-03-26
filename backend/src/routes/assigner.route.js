import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getAllTasks, 
    getTaskById, 
    assignTask, 
    acceptTask, 
    editTask, 
    deleteTask, 
    reassignTask, 
    markComplete, 
    approveCompletion, 
    getCompletedTasks  
} from "../controllers/assigner.controller.js";

const router = express.Router();
router.use(verifyJWT);

router.route('/')
  .get(getAllTasks)         
  .post(assignTask);        

router.route('/:id')
  .get(getTaskById)          
  .patch(editTask)           
  .delete(deleteTask);       

router.post('/:taskId/accept', acceptTask);         
router.post('/:taskId/reassign', reassignTask);     
router.post('/:taskId/complete', markComplete);     
router.post('/:taskId/approve', approveCompletion); 



export default router;
