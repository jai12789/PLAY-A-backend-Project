import mongoose ,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema= new Schema({
    videofile:{
        type:String ,
        rquired: true
    },
    thumbnail:{
        type:String ,
        rquired: true
    },
    title:{
        type:String ,
        rquired: true
    },
    description:{
        type:String ,
        rquired: true
    },
    duration:{
        type: Number, 
        required: true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"

    }

},{timestamps:true})



export const Video=mongoose.model("Video",videoSchema)