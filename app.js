
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
import { SitemapStream, streamToPromise } from 'sitemap';

dotenv.config();
const app = express();
const PORT = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL
const FRONTEND_URL = process.env.FRONTEND_URL

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
let sitemap;

const generateSitemap = async () => {
    const smStream = new SitemapStream({ hostname: `${FRONTEND_URL}` });

    // Static pages
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

    // Convert stream to buffer and return as gzipped sitemap
    return streamToPromise(smStream).then((data) => data.toString());
};

app.get('/sitemap.xml', async (req, res) => {
    try {
        // Cache the sitemap for performance
        if (!sitemap) {
            sitemap = await generateSitemap();
        }

        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

setInterval(async () => {
    sitemap = await generateSitemap();
}, 1000 * 60 * 60);






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