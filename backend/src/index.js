import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'
import serverless from "serverless-http"

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 4000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})

export const handler = serverless(app);