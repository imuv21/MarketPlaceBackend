import mongoose from "mongoose";
const roleOptions = ["buyer", "seller", "admin"];

//Notification schema
const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    }
});

//Message schema
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

//Order schema
const orderSchema = new mongoose.Schema({
    razorpay_order_id: {
        type: String,
        required: true
    },
    razorpay_payment_id: {
        type: String,
        required: true
    },
    razorpay_signature: {
        type: String,
        required: true
    }
});

//Movie schema
const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    comment: {
        type: String,
        trim: true,
    },
    poster: {
        type: String,
        trim: true,
    }
});

//Schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    confirmPassword: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        required: true,
        enum: roleOptions,
        default: "buyer",
    },
    country: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        trim: true,
    },
    isVerified: {
        type: Number,
        default: 0,
    },
    otp: {
        type: String,
        trim: true,
    },
    otpExpiry: {
        type: Date,
    },

    notifications: [notificationSchema],

    messages: [messageSchema],

    orders: [orderSchema],

    friendReq: {
        type: Array,
        default: [],
    },
    friends: {
        type: Array,
        default: [],
    },

    movies: [movieSchema]
});

//Composite index on email and role
userSchema.index({ email: 1, role: 1 }, { unique: true });

//Model
const userModel = mongoose.model("user", userSchema);

export default userModel