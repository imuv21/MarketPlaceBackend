
import cors from 'cors';
import connectDB from './config/connectDB.js';
import userRoute from './routes/userRoute.js';
import authRoute from './routes/authRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';

dotenv.config();
const app = express();
const PORT = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL

// Security Headers
app.use(helmet());

//cors
const allowedOrigins = [
    "http://localhost:5173",
    "https://imuv21.netlify.app"
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,POST,PUT,PATCH,DELETE",
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

//Database connection
connectDB(DATABASE_URL);

//JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Loading routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/", authRoute);

//http server
const server = http.createServer(app);

//Listening to ports
server.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`); //remove this for production
});