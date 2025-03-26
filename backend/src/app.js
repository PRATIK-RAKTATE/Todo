import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Default to localhost if env variable is missing
    credentials: true
}));

app.use(express.json({limit: "1000kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(cookieParser())
app.use(express.static("public"))



// Routes Import
import userRouter from './routes/user.route.js';
import studentRouter from './routes/student.route.js'; // ✅ Fixed typo in filename
import staffRouter from './routes/staff.route.js';
import coordinatorRouter from './routes/coordinator.route.js';
import taskRouter from './routes/task.route.js';
import assignerRouter from './routes/assigner.route.js';
import CompletedTasks from "../../frontend/src/components/TaskManagement/CompletedTasks.tsx";


// Routes Declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/coordinator", coordinatorRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/assigner", assignerRouter);
app.use("/api/v1/assigner/completed-tasks", CompletedTasks); // ✅ Added completed tasks route

// Health Check Route
app.get("/api/v1/healthcheck", (req, res) => {
    res.status(200).json({ message: "API is running smoothly! 🚀" });
});

// Fallback Route for Undefined Routes
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).json({ message: "Something went wrong!", error: err.message });
});

export { app };
