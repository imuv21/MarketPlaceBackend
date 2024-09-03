
import cors from 'cors';
import connectDB from './config/connectDB.js';
import userRoute from './routes/userRoute.js';
import authRoute from './routes/authRoute.js';
import serviceRoute from './routes/serviceRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SitemapStream, streamToPromise } from 'sitemap';
export const app = express();

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

//Sitemap
app.get('/sitemap.xml', async (req, res) => {
    try {
        const smStream = new SitemapStream({ hostname: `https://imuv21.netlify.app` });

        smStream.write({ url: '/', changefreq: 'monthly', priority: 1.0 });
        smStream.write({ url: '/shoping', changefreq: 'hourly', priority: 0.9 });
        smStream.write({ url: '/add-new-movie', changefreq: 'hourly', priority: 0.9 });
        smStream.write({ url: '/discover', changefreq: 'hourly', priority: 0.9 });
        smStream.write({ url: '/friend-list', changefreq: 'hourly', priority: 0.8 });
        smStream.write({ url: '/order', changefreq: 'hourly', priority: 0.8 });
        smStream.write({ url: '/cart', changefreq: 'monthly', priority: 0.7 });
        smStream.write({ url: '/friend-requests', changefreq: 'hourly', priority: 0.7 });
        smStream.write({ url: '/notifications', changefreq: 'hourly', priority: 0.7 });
        smStream.write({ url: '/profile', changefreq: 'monthly', priority: 0.6 });
        smStream.write({ url: '/login', changefreq: 'yearly', priority: 0.4 });
        smStream.write({ url: '/signup', changefreq: 'yearly', priority: 0.4 });
        smStream.write({ url: '/verify-otp', changefreq: 'yearly', priority: 0.4 });
        smStream.write({ url: '/payment-success', changefreq: 'yearly', priority: 0.3 });
        smStream.write({ url: '/payment-failed', changefreq: 'yearly', priority: 0.3 });

        smStream.write({ url: '/play-games', changefreq: 'yearly', priority: 0.2 });
        smStream.write({ url: '/snake', changefreq: 'yearly', priority: 0.2 });
        smStream.write({ url: '/text-to-speech', changefreq: 'yearly', priority: 0.2 });
        smStream.end();

        const sitemap = await streamToPromise(smStream);
        res.header('Content-Type', 'application/xml');
        res.send(sitemap.toString());

    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

//Loading routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/service", serviceRoute);
app.use("/", authRoute);

