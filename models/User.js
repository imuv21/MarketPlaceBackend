import mongoose from "mongoose";
const roleOptions = ["buyer", "seller", "admin"];
const listPrivacy = ["private", "public"];

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

//Product schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    amount: {
        type: Number,
    },
    disAmount: {
        type: Number,
        default: 0,
    },
    img: {
        type: String,
        trim: true,
    }
});

//Order schema
const orderSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },

    // Razorpay-specific fields
    razorpay_order_id: {
        type: String
    },
    razorpay_payment_id: {
        type: String
    },
    razorpay_signature: {
        type: String
    },

    // PayPal-specific fields
    paypal_payment_id: {
        type: String
    },
    paypal_payer_id: {
        type: String
    },

    // General order status
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

//Movie schema
const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    rating: {
        type: Number,
        required: true,
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

//List schema
const listSchema = new mongoose.Schema({
    listName: {
        type: String,
        required: true, 
        trim: true      
    },
    privacy: {
        type: String,
        required: true,   
        enum: listPrivacy,
        default: "public",    
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    numberOfProjects: {
        type: Number,
        min: 0          
    },
    listPoster: {
        type: String,
        trim: true
    },
    movies: [movieSchema]
});

//User schema
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
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    countryCode: {
        type: String,
        required: true,
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
    lists: [listSchema],
    products: [productSchema]
});

//Composite index on email and role
userSchema.index({ email: 1, role: 1 }, { unique: true });

//Model
const userModel = mongoose.model("user", userSchema);
const orderModel = mongoose.model('order', orderSchema);

export { userModel, orderModel };