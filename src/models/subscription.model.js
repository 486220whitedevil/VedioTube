import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // get from the cloudinary
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // this is channel which is the details of user channel
        ref: "User"
    }
},{timestamps: true})

export const Subscription = mongoose.model("Subscription" , subscriptionSchema)