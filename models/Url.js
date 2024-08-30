import mongoose from "mongoose";

//Url schema
const urlSchema = new mongoose.Schema(
    {
        shortId: {
            type: String,
            required: true,
            unique: true
        },
        redirectUrl: {
            type: String,
            required: true
        },
        visitHistory: [{ timestamp: { type: Number } }]
    },
    { timestamps: true }
);

const urlModel = mongoose.model("url", urlSchema);
export default urlModel