import userModel from "../models/User.js";
import { validationResult } from "express-validator";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import sendMail from '../helpers/mailer.js';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'avatars' }, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};

const uploadPostersToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'MarketPlace/Mcu' }, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};

class userCont {

    static seeAllUsers = async (req, res) => {
        try {
            const userId = req.user._id;
            const user = await userModel.findById(userId).select('friends');
            if (!user) {
                return res.status(404).send({ "status": "failed", "message": "User not found" });
            }
            const friendsIds = user.friends.map(friendId => friendId.toString());
            const allUsers = await userModel.find().select('firstName lastName country role isVerified image');
            const users = allUsers.filter(user => user._id.toString() !== userId.toString() && !friendsIds.includes(user._id.toString()));

            return res.status(200).send({ "status": "success", "message": "All users fetched successfully", "users": users });
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static searchUsers = async (req, res) => {
        try {
            const { searchQuery } = req.query;
            if (searchQuery === '') {
                return res.status(404).send({ "status": "failed", "message": "No users found" });
            }

            const query = {
                $or: [
                    { firstName: { $regex: searchQuery, $options: 'i' } }, // Case insensitive search
                    { lastName: { $regex: searchQuery, $options: 'i' } },
                    { email: { $regex: searchQuery, $options: 'i' } }
                ]
            };

            const users = await userModel.find(query).select('-password -otp -otpExpiry'); // Exclude sensitive fields
            if (!users.length) {
                return res.status(404).send({ "status": "failed", "message": "No users found" });
            }
            res.status(200).send({ "status": "success", "users": users });

        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    };

    static sendFriendRequest = async (req, res) => {
        try {
            const { friendId } = req.body;
            const userId = req.user._id;

            const UserID = new mongoose.Types.ObjectId(userId);
            const FriendID = new mongoose.Types.ObjectId(friendId);

            const friend = await userModel.findById(FriendID);

            if (!friend) {
                return res.status(404).send({ "status": "failed", "message": "Friend not found" });
            }
            if (FriendID.equals(UserID)) {
                return res.status(400).send({ "status": "failed", "message": "You cannot send a friend request to yourself" });
            }

            const existingFriendRequest = await userModel.findOne({ _id: FriendID, friendReq: { $in: [UserID] } });
            if (existingFriendRequest) {
                return res.status(400).send({ "status": "failed", "message": "Friend request already sent" });
            }

            await userModel.findByIdAndUpdate(FriendID, { $push: { friendReq: UserID } });
            await userModel.findByIdAndUpdate(FriendID, { $push: { notifications: { type: "friend_request", from: UserID } } });

            return res.status(200).send({ "status": "success", "message": "Friend request sent successfully" });
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static responseToFriendRequest = async (req, res) => {
        try {
            const { response, friendId } = req.body;
            const userId = req.user._id;

            if (!['accept', 'reject'].includes(response)) {
                return res.status(400).send({ "status": "failed", "message": "Invalid response" });
            }

            const UserID = new mongoose.Types.ObjectId(userId);
            const FriendID = new mongoose.Types.ObjectId(friendId);

            if (response === 'accept') {
                const user = await userModel.findByIdAndUpdate(UserID, { $pull: { friendReq: FriendID, notifications: { type: "friend_request", from: FriendID } }, $push: { friends: FriendID } }, { new: true });
                const friend = await userModel.findByIdAndUpdate(FriendID, { $push: { friends: UserID } }, { new: true });
                await userModel.findByIdAndUpdate(FriendID, { $push: { notifications: { type: "friend_request_accepted", from: UserID } } });

                if (user && friend) {
                    return res.status(200).send({ "status": "success", "message": "Friend request accepted successfully" });
                } else {
                    return res.status(500).send({ "status": "failed", "message": "An error occurred while accepting friend request" });
                }
            } else if (response === 'reject') {
                const user = await userModel.findByIdAndUpdate(UserID, { $pull: { friendReq: FriendID, notifications: { type: "friend_request", from: FriendID } } }, { new: true });
                await userModel.findByIdAndUpdate(FriendID, { $push: { notifications: { type: "friend_request_rejected", from: UserID } } });
                if (user) {
                    return res.status(200).send({ "status": "success", "message": "Friend request rejected successfully" });
                } else {
                    return res.status(500).send({ "status": "failed", "message": "An error occurred while rejecting friend request" });
                }
            }
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static getNotifications = async (req, res) => {
        try {
            const userId = req.user._id;
            const user = await userModel.findById(userId, 'notifications').lean();

            if (!user) {
                return res.status(404).send({ "status": "failed", "message": "User not found" });
            }

            const notifications = await Promise.all(user.notifications.map(async (notification) => {
                const fromUser = await userModel.findById(notification.from, 'firstName lastName image').lean();
                return {
                    _id: notification._id,
                    type: notification.type,
                    from: notification.from,
                    fromUser: fromUser ? {
                        firstName: fromUser.firstName,
                        lastName: fromUser.lastName,
                        image: fromUser.image
                    } : null
                };
            }));

            return res.status(200).send({ "status": "success", "totalNotifications": notifications.length, "notifications": notifications });
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static deleteNotification = async (req, res) => {
        try {
            const userId = req.user._id;
            const notificationId = req.params.notificationId;
            const user = await userModel.findById(userId).lean();

            if (!user) {
                return res.status(404).send({ "status": "failed", "message": "User not found" });
            }
            // Find the notification to be deleted
            const notificationIndex = user.notifications.findIndex(notification => notification._id.toString() === notificationId);
            if (notificationIndex === -1) {
                return res.status(404).send({ "status": "failed", "message": "Notification not found" });
            }

            // Remove the notification from the user's notifications array
            user.notifications.splice(notificationIndex, 1);
            await userModel.findByIdAndUpdate(userId, { notifications: user.notifications });
            return res.status(200).send({ "status": "success", "message": "Notification deleted successfully" });

        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static getFriendReqs = async (req, res) => {
        try {
            const userId = req.user._id;
            const user = await userModel.findById(userId).select('friendReq');
            if (!user) {
                return res.status(404).send({ "status": "failed", "message": "User not found" });
            }

            const friendReqs = await Promise.all(user.friendReq.map(async (friendId) => {
                const friend = await userModel.findById(friendId).select('firstName lastName role country isVerified image');
                return friend ? {
                    _id: friend._id,
                    firstName: friend.firstName,
                    lastName: friend.lastName,
                    role: friend.role,
                    country: friend.country,
                    isVerified: friend.isVerified,
                    image: friend.image
                } : null;
            }));

            return res.status(200).send({ "status": "success", "friendReqs": friendReqs.filter(req => req !== null) });
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static getFriends = async (req, res) => {
        try {
            const userId = req.user._id;
            const user = await userModel.findById(userId).select('friends');
            if (!user) {
                return res.status(404).send({ "status": "failed", "message": "User not found" });
            }

            const friends = await Promise.all(user.friends.map(async (friendId) => {
                const friend = await userModel.findById(friendId).select('firstName lastName role country image email isVerified movies');
                return friend ? {
                    _id: friend._id,
                    firstName: friend.firstName,
                    lastName: friend.lastName,
                    role: friend.role,
                    country: friend.country,
                    image: friend.image,
                    email: friend.email,
                    isVerified: friend.isVerified,
                    movies: friend.movies
                } : null;
            }));

            return res.status(200).send({ "status": "success", "friends": friends.filter(friend => friend !== null) });
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }




    static userSignup = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { firstName, lastName, email, password, confirmPassword, role, country } = req.body;

        const user = await userModel.findOne({ email: email, role: role });
        if (user) {
            return res.status(400).send({ "status": "failed", "message": `User already exists as ${role}` });
        } else {
            if (firstName && lastName && email && password && confirmPassword && role && country) {
                if (password !== confirmPassword) {
                    res.status(400).send({ "status": "failed", "message": "Passwords do not match" });
                } else {
                    try {
                        const salt = await bcrypt.genSalt(10);
                        const hashPassword = await bcrypt.hash(password, salt);

                        const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
                        const otpExpiry = Date.now() + 15 * 60 * 1000; // OTP valid for 15 minutes

                        let image = null;
                        if (req.file) {
                            image = await uploadToCloudinary(req.file.buffer);
                        }

                        const newUser = new userModel({ firstName, lastName, email, password: hashPassword, role, country, image, otp, otpExpiry });
                        await newUser.save();

                        const msg = `
                        <div style="font-family: 'Roboto', sans-serif; width: 100%;">
        <div style="background: #5AB2FF; padding: 10px 20px; border-radius: 3px; border: none">
            <a href="" style="font-size:1.6em; color: white; text-decoration:none; font-weight:600">MarketPlace</a>
        </div>
        <p>Hello <span style="color: #5AB2FF; font-size: 1.2em; text-transform: capitalize;">${newUser.firstName}</span>!</p>
        <p>Thank you for choosing MarketPlace. Use the following OTP to complete your Sign Up procedure. This OTP is valid for 15 minutes.</p>
        <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
            <div style="background: #5AB2FF; color: white; width: fit-content; border-radius: 3px; padding: 5px 10px; font-size: 1.4em;">${otp}</div>
        </div>
      
        <p>Regards,</p>
        <p>MarketPlace</p>
    </div>
                        `;

                        await sendMail(newUser.email, 'Verify your email', msg);
                        return res.status(201).send({ "status": "success", "message": `User created successfully. Please verify your email using the OTP sent to your email ${newUser.email}.` });
                    } catch (error) {
                        return res.status(500).send({ "status": "failed", "message": error.message });
                    }
                }
            } else {
                res.status(400).send({ "status": "failed", "message": "All fields are required" });
            }
        }
    }

    static getMovie = async (req, res) => {
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(400).send({ "status": "failed", "message": "User not found" });
        } else {
            return res.status(200).send({ "status": "success", "data": user.movies });
        }
    }

    static addMovie = async (req, res) => {
        const { title, rating, comment } = req.body;

        if (!title || !rating) {
            return res.status(400).send({ "status": "failed", "message": "Title, rating, and comment are required" });
        } else {
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(400).send({ "status": "failed", "message": "User not found" });
            } else {
                let poster = null;
                if (req.file) {
                    poster = await uploadPostersToCloudinary(req.file.buffer);
                }
                user.movies.push({ title, rating, comment, poster });
                await user.save();
                return res.status(201).send({ "status": "success", "message": "Movie added successfully" });
            }
        }
    }

    static deleteMovie = async (req, res) => {
        const { movieId } = req.body;
        if (!movieId) {
            return res.status(400).send({ "status": "failed", "message": "Movie ID is required" });
        }
        try {
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(400).send({ "status": "failed", "message": "User not found" });
            }
            const movieIndex = user.movies.findIndex(movie => movie._id.toString() === movieId);
            if (movieIndex === -1) {
                return res.status(400).send({ "status": "failed", "message": "Movie not found" });
            }
            const movie = user.movies[movieIndex];

            if (movie.poster) {
                const posterId = movie.poster.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`MarketPlace/Mcu/${posterId}`, (error, result) => {
                    if (error) {
                        console.log("Error deleting image from Cloudinary:", error);
                    } else {
                        console.log("Image deleted from Cloudinary:", result);
                    }
                });
            }

            user.movies.splice(movieIndex, 1);
            await user.save();
            return res.status(200).send({ "status": "success", "message": "Movie deleted successfully" });

        } catch (error) {
            console.error("Error deleting movie:", error);
            return res.status(500).send({ "status": "failed", "message": error.message });
        } 
    }

    static verifyOtp = async (req, res) => {

        const { email, otp, role } = req.body;

        if (!email || !otp || !role) {
            return res.status(400).send({ "status": "failed", "message": "Email, OTP, and role are required" });
        }

        try {
            const user = await userModel.findOne({ email: email, role: role });
            if (!user) {
                return res.status(400).send({ "status": "failed", "message": `User with role ${role} not found` });
            }
            if (user.otp !== otp) {
                return res.status(400).send({ "status": "failed", "message": "Invalid OTP" });
            }
            if (Date.now() > user.otpExpiry) {
                return res.status(400).send({ "status": "failed", "message": "OTP expired" });
            }

            user.otp = null;
            user.otpExpiry = null;
            user.isVerified = 1;
            await user.save();

            return res.status(200).send({ "status": "success", "message": "Email verified successfully. Please login now." });
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static deleteUser = async (req, res) => {
        try {
            const { email, password, role } = req.body;
            if (!email || !password || !role) {
                return res.status(400).send({ "status": "failed", "message": "Email, password, and role are required" });
            }
            const user = await userModel.findOne({ email: email, role: role });

            if (!user) {
                return res.status(404).send({ "status": "failed", "message": "User not found" });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).send({ "status": "failed", "message": "Invalid password" });
            }

            if (user.image) {
                const imageId = user.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`avatars/${imageId}`, (error, result) => {
                    if (error) {
                        console.log("Error deleting image from Cloudinary:", error);
                    } else {
                        console.log("Image deleted from Cloudinary:", result);
                    }
                });
            }

            await userModel.deleteOne({ _id: user._id });
            return res.status(200).send({ "status": "success", "message": "User deleted successfully" });
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    };

    static userLogin = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            const { role, email, password } = req.body;
            if (role && email && password) {
                const user = await userModel.findOne({ email: email, role: role });
                if (user !== null) {
                    const isMatch = await bcrypt.compare(password, user.password);
                    if ((user.email === email) && isMatch) {
                        const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
                        const userResponse = {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            role: user.role,
                            country: user.country,
                            isVerified: user.isVerified,
                            password: password,
                            image: user.image,
                            movies: user.movies,
                            friends: user.friends,
                            friendReq: user.friendReq,
                            notifications: user.notifications
                        };
                        res.status(200).send({ "status": "success", "message": "User logged in successfully", "token": token, "user": userResponse });
                    } else {
                        res.status(400).send({ "status": "failed", "message": "Email or password is incorrect" });
                    }
                } else {
                    return res.status(400).send({ "status": "failed", "message": `User with role ${role} not found` });
                }
            } else {
                res.status(400).send({ "status": "failed", "message": "All fields are required" });
            }
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static userLogout = async (req, res) => {
        try {
            res.status(200).send({ "status": "success", "message": "User logged out successfully" });
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static userProfileUpdate = async (req, res) => {
        try {
            const { firstName, lastName, country } = req.body;
            let newImageUrl = null;
            let oldImagePublicId = null;

            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(404).send({ "status": "failed", "message": "User not found" });
            }

            if (req.file) {
                newImageUrl = await uploadToCloudinary(req.file.buffer);
                if (user.image) {
                    oldImagePublicId = user.image.split('/').pop().split('.')[0];
                }
            }

            const updateData = { firstName, lastName, country };
            if (newImageUrl) {
                updateData.image = newImageUrl;
            }

            const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true });

            if (updatedUser) {
                if (oldImagePublicId) {
                    await cloudinary.uploader.destroy(`avatars/${oldImagePublicId}`, (error, result) => {
                        if (error) {
                            console.error('Error deleting old image from Cloudinary:', error);
                        } else {
                            console.log('Old image deleted from Cloudinary:', result);
                        }
                    });
                }
                res.status(200).send({ "status": "success", "message": "User profile updated successfully", "user": updatedUser });
            } else {
                res.status(404).send({ "status": "failed", "message": "User not found" });
            }
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static changePassword = async (req, res) => {
        const { password, confirmPassword } = req.body;
        if (password && confirmPassword) {
            if (password !== confirmPassword) {
                res.status(400).send({ "status": "failed", "message": "Passwords do not match" });
            } else {
                const salt = await bcrypt.genSalt(10);
                const newHashPassword = await bcrypt.hash(password, salt);
                await userModel.findByIdAndUpdate(req.user._id, { $set: { password: newHashPassword } });
                res.status(200).send({ "status": "success", "message": "Password changed successfully" });
            }
        } else {
            res.status(400).send({ "status": "failed", "message": "All fields are required" });
        }
    }

    static loggedUser = async (req, res) => {
        res.status(200).send({ "status": "success", "user": req.user, "message": "User logged in successfully", });
    }

    static forgotPassword = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { email, role } = req.body;
            if (email && role) {
                const user = await userModel.findOne({ email: email, role: role });
                if (user) {

                    const secret = user._id + process.env.JWT_SECRET_KEY;
                    const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '15m' });
                    const link = `http://localhost:3000/api/v1/user/reset-password/${user._id}/${token}`;

                    const msg = `
                        <div style="font-family: 'Roboto', sans-serif; width: 100%;">
        <div style="background: #5AB2FF; padding: 10px 20px; border-radius: 3px; border: none">
            <a href="" style="font-size:1.6em; color: white; text-decoration:none; font-weight:600">MarketPlace</a>
        </div>
        <p>Hello <span style="color: #5AB2FF; font-size: 1.2em; text-transform: capitalize;">${user.firstName}</span>!</p>
        <p>Thank you for choosing MarketPlace. Use the following OTP to complete your Sign Up procedure. This OTP is valid for 15 minutes.</p>
        <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
            <div style="background: #5AB2FF; color: white; width: fit-content; border-radius: 3px; padding: 5px 10px; font-size: 1.4em;">${otp}</div>
        </div>
      
        <p>Regards,</p>
        <p>MarketPlace</p>
    </div>
                        `;




                    await sendMail(user.email, 'Forgot Password', msg);
                    res.status(200).send({ "status": "success", "message": "Password reset link sent to your email", "link": link });
                } else {
                    res.status(400).send({ "status": "failed", "message": "User not found" });
                }
            } else {
                res.status(400).send({ "status": "failed", "message": "All fields are required" });
            }

        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static resetPassword = async (req, res) => {
        const { password, confirmPassword } = req.body;
        const { id, token } = req.body;
        const user = await userModel.findById(id);
        const newSecret = user._id + process.env.JWT_SECRET_KEY;
        try {
            jwt.verify(token, newSecret);
            if (password && confirmPassword) {
                if (password !== confirmPassword) {
                    res.status(400).send({ "status": "failed", "message": "Passwords do not match" });
                } else {
                    const salt = await bcrypt.genSalt(10);
                    const newHashPassword = await bcrypt.hash(password, salt);
                    await userModel.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } });
                    res.status(200).send({ "status": "success", "message": "Password reset successfully" });
                }
            } else {
                res.status(400).send({ "status": "failed", "message": "All fields are required" });
            }
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static mailVerification = async (req, res) => {
        try {
            if (req.query.id === undefined) {
                return res.status(404).send({ "status": "failed", "message": "Invalid token!" });
            }
            const userData = await userModel.findOne({ _id: req.query.id });
            if (userData) {
                if (userData.isVerified === 1) {
                    return res.status(400).send({ "status": "failed", "message": "Email already verified!" });
                }
                await userModel.findByIdAndUpdate({ _id: req.query.id }, {
                    $set: {
                        isVerified: 1
                    }
                });
                return res.status(200).send({ "status": "success", "message": "Email verified successfully!" });
            } else {
                return res.status(404).send({ "status": "failed", "message": "User not found!" });
            }
        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }

    static sendMailVerification = async (req, res) => {

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, msg: 'Validation error', errors: errors.array() });
            }

            const { email } = req.body;
            const userData = await userModel.findOne({ email: email });

            if (!userData) {
                return res.status(404).send({ "status": "failed", "message": "User not found!" });
            }
            if (userData.isVerified === 1) {
                return res.status(400).send({ "status": "failed", "message": "Email already verified!" });
            }

            const msg = `<p>Hello! ${userData.firstName}. Thanks for signing up. Please <a href="http://localhost:8000/mail-verification?id=${userData._id}">click here</a> to verify your email.</p>`;
            await sendMail(userData.email, 'Verify your email', msg);
            res.status(200).send({ "status": "success", "message": "Verification link sent to your email." });

        } catch (error) {
            return res.status(500).send({ "status": "failed", "message": error.message });
        }
    }
}

export default userCont;

