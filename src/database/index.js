import mongoose, { connect } from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\n MongoDB connected Successfully !! Connection Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection Error" , error)
        process.exit(1)
    }

}

export default connectDB