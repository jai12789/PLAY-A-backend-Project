import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubs = asyncHandler(async(req,res)=>{
    const{ channelId}= req.params

    const user = await User.findById(channelId)
    if(!user){
        throw new ApiError(404, "User not found")
    }

    if(!isValidObjectId(channelId)){
        throw new ApiError(401,"Invalid Channel Id")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(401, "Channel does not exist")
    }
    try {
        const isSubsctribedTo= await Subscription.findOne({
            channel: channelId,
            subscriber : user?._id
        })

        if(!isSubsctribedTo){
            const createSubscription = await Subscription.create({
                channel:channelId,
                subscriber: user?._id
            })
            if(!createSubscription){
                throw new ApiError(404,"Error while Subscribing")
            }
            res.status(200).json(new ApiResponse(200, createSubscription,"Subscribed Successfully"))
        }
        else{
            const removeSubscription= await Subscription.findOneAndDelete({
                channel:channelId,
                subscriber:user?._id
            })
            if(!removeSubscription){
                throw new ApiError(404,"Error Occured")
            }
            res.status(200).json(new ApiResponse(200, removeSubscription,"Unsubscribed Successfully"))
        }

    } catch (error) {
        throw new ApiError(404,error.message)
    }
})

const getUserChannelSubs= asyncHandler(async(req,res)=>{
    const{channelId}= req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(401,"Invalid Channel Request")
    }
    const channel= await User.findById(channelId)
    if(!channel){
        throw new ApiError(404,"No Such Channel Found")
    }
    try {
        const listSubscribers= await Subscription.aggregate([
            {
                $match:{
                    channel: new mongoose.Types.ObjectId(channelId)
                }

            },
            {
                $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subscriberInfo",
                    pipeline:[{
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }]
                }
            },
            {
                $addFields:{
                    subscriberInfo: {
                        $first: "$subscriberInfo"
                    }
                }
            },
            {
                $project:{
                    subscriberInfo:1
                }
            }
        ])

        if(listSubscribers.length ===0 ){
            return res.status(200).json(new ApiResponse(200,listSubscribers,"No subscriber yet"))
        }
        return res.status(200).json(new ApiResponse(200,listSubscribers,"List Of Subscribers fetched successfully"))
    } catch (error) {
        throw new ApiError(404,error.message)
    }
})

const getSubscribedChannels= asyncHandler(async(req,res)=>{
    const { subscriberId}= req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(401,"Invalid subscriber id")
    }
    const subscriber = await User.findById(subscriberId)

    if(!subscriber){
        throw new ApiError(401,"Subscriber does not exist")
    }

    try {
        const listChannels= await Subscription.aggregate([
            {
                $match:{
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"channelSubscribedTo",
                    pipeline:[{
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }]
                }
            },
            {
            $addFields: {
                subscriberInfo:{
                    $first:"$subscriberInfo"
                }
                }
            },
            {
                $project:{
                    channelIsSubscribedTo:1
                }
            }
        ])

        if(listChannels.length===0){
            return res.status(200).json(new ApiResponse(200,listChannels,"No channel subscribed "))
        }
        return res.status(200),json(new ApiResponse(200,listChannels,"List of channels subscribed found"))
    } catch (error) {
        throw new ApiError(404,error.message)
    }
})

export{
    toggleSubs,
    getUserChannelSubs,
    getSubscribedChannels
}