import mongoose,{Schema} from  "mongoose";


const videoSchema = new Schema({
    videoFile: {
        type: String, // get from the cloudinay 
        required: true
    },
    thumbnail: {
        type: String, // get from the cloudinay
        required: true
    },
    title: {
        type: String, // get from the cloudinay
        required: true
    },
    description: {
        type: String,
        required: true
    }
},{timestamps: true})
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video" , videoSchema)
