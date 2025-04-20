import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowRight, X, Edit, Trash2, MoreVertical } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface MilestoneData {
  id: string;
  milestone: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu = ({ x, y, onEdit, onDelete, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bg-white shadow-lg rounded-md py-1 z-50 border border-blue-200 min-w-32"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2 text-blue-700"
        onClick={onEdit}
      >
        <Edit size={16} /> Edit
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2 text-red-600"
        onClick={onDelete}
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  );
};

const Milestone: React.FC = () => {
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [newMilestone, setNewMilestone] = useState<string>("");
  const [editMilestone, setEditMilestone] = useState<string>("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    milestoneId: string | null;
  }>({
    x: 0,
    y: 0,
    visible: false,
    milestoneId: null,
  });

  // Fetch milestones from the API on component mount
  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const response = await axios.get<MilestoneData[]>(
        "http://localhost:4000/api/v1/assigner/task/milestone",
        { withCredentials: true }
      );
      // We're setting them directly without reversing
      setMilestones(response.data);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      toast.error("Failed to load milestones");
    }
  };

  const addMilestone = async () => {
    if (newMilestone.trim() === "") return;
    try {
      const response = await axios.post<MilestoneData>(
        "http://localhost:4000/api/v1/assigner/task/milestone",
        { milestone: newMilestone },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      // Add new milestone to the end of the array (will appear on the right)
      const createdMilestone = response.data;
      setMilestones([...milestones, createdMilestone]);
      setNewMilestone("");
      setDialogOpen(false); // Close the dialog after adding
      toast.success("Milestone added successfully");
    } catch (error) {
      console.error("Error adding milestone:", error);
      toast.error("Failed to add milestone");
    }
  };

  const updateMilestone = async () => {
    if (!selectedMilestoneId || editMilestone.trim() === "") return;

    try {
      await axios.patch(
        `http://localhost:4000/api/v1/assigner/task/milestone/${selectedMilestoneId}`,
        { milestone: editMilestone },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      setMilestones(
        milestones.map((m) =>
          m.id === selectedMilestoneId ? { ...m, milestone: editMilestone } : m
        )
      );

      setEditDialogOpen(false);
      toast.success("Milestone updated successfully");
    } catch (error) {
      console.error("Error updating milestone:", error);
      toast.error("Failed to update milestone");
    }
  };

  const deleteMilestone = async () => {
    if (!selectedMilestoneId) return;

    try {
      await axios.delete(
        `http://localhost:4000/api/v1/assigner/task/milestone/${selectedMilestoneId}`,
        { withCredentials: true }
      );

      setMilestones(milestones.filter((m) => m.id !== selectedMilestoneId));
      setDeleteDialogOpen(false);
      toast.success("Milestone deleted successfully");
    } catch (error) {
      console.error("Error deleting milestone:", error);
      toast.error("Failed to delete milestone");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, milestoneId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
      milestoneId,
    });
  };

  const handleEditClick = () => {
    if (contextMenu.milestoneId) {
      const milestone = milestones.find(
        (m) => m.id === contextMenu.milestoneId
      );
      if (milestone) {
        setSelectedMilestoneId(contextMenu.milestoneId);
        setEditMilestone(milestone.milestone);
        setEditDialogOpen(true);
      }
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleDeleteClick = () => {
    if (contextMenu.milestoneId) {
      setSelectedMilestoneId(contextMenu.milestoneId);
      setDeleteDialogOpen(true);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const hideContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="mt-20 mx-auto max-w-7xl">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
        Project Milestones
      </h2>

      <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-blue-50 rounded-lg shadow-md">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="flex items-center gap-4">
            <div
              className="relative group w-36 h-36 flex flex-col items-center justify-center rounded-full border-2 border-blue-300 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 text-lg font-medium shadow-md transition-all hover:shadow-lg cursor-pointer"
              onContextMenu={(e) => handleContextMenu(e, milestone.id)}
            >
              <div className="p-4 text-center">{milestone.milestone}</div>
              <button
                className="absolute -top-2 -right-2 bg-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, milestone.id);
                }}
              >
                <MoreVertical size={16} className="text-blue-600" />
              </button>
            </div>
            {index < milestones.length - 1 && (
              <ArrowRight className="text-blue-400 w-6 h-6" />
            )}
          </div>
        ))}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="p-3 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg">
              <Plus size={32} className="text-white" />
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-blue-800 text-xl font-bold">
                Add New Milestone
              </h2>
              <DialogTrigger asChild>
                <button onClick={() => setDialogOpen(false)}>
                  <X className="text-blue-600 cursor-pointer hover:text-blue-800" />
                </button>
              </DialogTrigger>
            </div>
            <input
              type="text"
              placeholder="Enter milestone title"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              className="w-full p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addMilestone}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium transition-colors shadow-md"
            >
              Add Milestone
            </button>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-blue-800 text-xl font-bold">
                Edit Milestone
              </h2>
              <button onClick={() => setEditDialogOpen(false)}>
                <X className="text-blue-600 cursor-pointer hover:text-blue-800" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter milestone title"
              value={editMilestone}
              onChange={(e) => setEditMilestone(e.target.value)}
              className="w-full p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={updateMilestone}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium transition-colors shadow-md"
            >
              Update Milestone
            </button>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-blue-800 text-xl font-bold">
                Delete Milestone
              </h2>
              <button onClick={() => setDeleteDialogOpen(false)}>
                <X className="text-blue-600 cursor-pointer hover:text-blue-800" />
              </button>
            </div>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this milestone? This action cannot
              be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteMilestone}
                className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onClose={hideContextMenu}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Milestone;
