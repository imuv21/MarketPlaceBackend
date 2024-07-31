import cors from 'cors';
import connectDB from './config/connectDB.js';
import userRoute from './routes/userRoute.js';
import authRoute from './routes/authRoute.js';
import session from 'express-session';
import passport from 'passport';
import OAuth2Strategy from 'passport-google-oauth2';
import jwt from 'jsonwebtoken';
import googleUserModel from './models/GoogleUser.js';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();


const PORT = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL
const GOOGLE_ID = process.env.GOOGLE_ID
const GOOGLE_SECRET = process.env.GOOGLE_SECRET

const allowedOrigins = [
    "http://localhost:5173",
    "https://imuv21.netlify.app"
];

//just commenting this for production
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));
//Database connection
connectDB(DATABASE_URL);
//JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Session
app.use(session({
    secret: "forthenightisdarkandfullofterrors",
    resave: false,
    saveUninitialized: false   //keep it false
}));


//Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new OAuth2Strategy({
        clientID: GOOGLE_ID,
        clientSecret: GOOGLE_SECRET,
        callbackURL: "/auth/google/callback",
        scope: ["profile", "email"]
    }, async (accessToken, refreshToken, profile, done) => {
        console.log(profile);
        try {
            let user = await googleUserModel.findOne({ googleId: profile.id });
            if (!user) {
                user = new googleUserModel({
                    googleId: profile.id,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    email: profile.emails[0].value,
                    image: profile.photos[0].value
                });
                await user.save();
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    })
);
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});


//initial google auth login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
//google auth callback
app.get("/auth/google/callback", passport.authenticate("google", {
    successRedirect: "http://localhost:5173/logout",
    failureRedirect: "http://localhost:5173/login"
}));
app.get("/googleuserdata", async (req, res) => {
    if (req.user) {
        const token = jwt.sign({ userID: req.user.googleId }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
        res.status(200).send({ "status": "success", "message": "User data fetched successfully", "token": token, "user": req.user });
    } else {
        res.status(400).send({ "status": "failed", "message": "Not Authorized" });
    }
});


//Loading routes
app.use("/api/v1/user", userRoute);
app.use("/", authRoute);


//Listening to ports
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`); //remove this for production
});