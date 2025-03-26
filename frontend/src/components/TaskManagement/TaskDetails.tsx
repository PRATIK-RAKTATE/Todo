import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { format } from 'date-fns';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'inProgress' | 'completed' | 'approved';
  assigner: User;
  receiver: User;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
  users: User[];
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose, users }) => {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [remark, setRemark] = useState(task.remark || '');
  const [newReceiverId, setNewReceiverId] = useState(task.receiver._id);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const { toast } = useToast();
  const currentUserId = localStorage.getItem('userId');
  const isAssigner = task.assigner._id === currentUserId;
  const isReceiver = task.receiver._id === currentUserId;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inProgress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Completed</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApproveTask = async (isApproved: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/tasks/${task._id}/approve`,
        { isApproved, remark },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast({
        title: 'Success',
        description: isApproved ? 'Task approved' : 'Task marked as incomplete',
      });
      setShowApproveDialog(false);
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  const handleReassignTask = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/tasks/${task._id}/reassign`,
        { newReceiverId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast({
        title: 'Success',
        description: 'Task reassigned successfully',
      });
      setShowReassignDialog(false);
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to reassign task',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  const handleEditTask = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/tasks/${task._id}`,
        { title: editTitle, description: editDescription },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
      setShowEditDialog(false);
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/tasks/${task._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
      setShowDeleteDialog(false);
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  const handleAcceptTask = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/tasks/${task._id}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast({
        title: 'Success',
        description: 'Task accepted',
      });
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to accept task',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  const handleMarkComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/tasks/${task._id}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast({
        title: 'Success',
        description: 'Task marked as complete',
      });
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark task as complete',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription className="mt-2">
                Created by: {task.assigner.name}
              </CardDescription>
            </div>
            {getStatusBadge(task.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Description</h3>
            <p className="mt-1">{task.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Assigned To</h3>
              <p className="mt-1">{task.receiver.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Status</h3>
              <p className="mt-1">{task.status}</p>
            </div>
          </div>
          
          {task.remark && (
            <div>
              <h3 className="text-sm font-medium">Remarks</h3>
              <p className="mt-1">{task.remark}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Created At</h3>
              <p className="mt-1">{format(new Date(task.createdAt), 'PPP p')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Last Updated</h3>
              <p className="mt-1">{format(new Date(task.updatedAt), 'PPP p')}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <div className="flex flex-wrap gap-2">
            {/* Receiver actions */}
            {isReceiver && task.status === 'pending' && (
              <Button onClick={handleAcceptTask}>
                Accept Task
              </Button>
            )}
            
            {isReceiver && task.status === 'inProgress' && (
              <Button onClick={handleMarkComplete}>
                Mark as Complete
              </Button>
            )}
            
            {/* Assigner actions */}
            {isAssigner && (
              <>
                <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                  Edit
                </Button>
                
                <Button variant="outline" onClick={() => setShowReassignDialog(true)}>
                  Reassign
                </Button>
                
                {task.status === 'completed' && (
                  <Button onClick={() => setShowApproveDialog(true)}>
                    Review
                  </Button>
                )}
                
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Approve/Reject Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Task Completion</DialogTitle>
            <DialogDescription>
              Approve or reject the completed task. Add remarks for feedback.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remark">Remarks</Label>
              <Textarea
                id="remark"
                placeholder="Add your feedback here"
                value={remark}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemark(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => handleApproveTask(false)}>
              Reject
            </Button>
            <Button onClick={() => handleApproveTask(true)}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
            <DialogDescription>
              Select a new user to assign this task to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newReceiver">New Assignee</Label>
              <Select 
                onValueChange={setNewReceiverId} 
                defaultValue={task.receiver._id}
              >
                <SelectTrigger>
                  <SelectValue aria-placeholder ="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleReassignTask}>
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Textarea
                id="title"
                placeholder="Task title"
                value={editTitle}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Task description"
                value={editDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleEditTask}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskDetails; 