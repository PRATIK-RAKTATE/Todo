import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({limit: "1000kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



//routes import
import userRouter from './routes/user.route.js'
import studentRouter from './routes/student.ruote.js'
import staffRouter from './routes/staff.route.js'
import coordinatorRouter from './routes/coordinator.route.js'
import assignerRouter from './routes/assigner.route.js';
import emailRouter from './routes/email.route.js'

//routes declaration
// app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/student", studentRouter)
app.use("/api/v1/staff", staffRouter)
app.use("/api/v1/coordinator", coordinatorRouter)
app.use("/api/v1/assigner/task", assignerRouter)
app.use("/api/v1/email", emailRouter)


// http://localhost:8000/api/v1/users/register

export { app }