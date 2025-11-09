import dotenv from 'dotenv';
import connectDB from './db/db.js';
import { app } from './app.js'; // Import the app with all routes and middleware

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    })
    app.on("error", (error) => {
        console.log("error in the server ",error);
        throw error;
    })
})
.catch((err) => {
    console.log("Error in mongo db connection", err);   
})

