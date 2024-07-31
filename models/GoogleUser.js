import mongoose from "mongoose";

//Schema
const googleUserSchema = new mongoose.Schema({
   googleId: String,
   displayName: String,
   email: String,
   image: String
}, {timestamps: true});


//Model
const googleUserModel = mongoose.model("googleUser", googleUserSchema);
export default googleUserModel