import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const publishVideo= asyncHandler(async(req,res)=>{
    const{title,description}= req.body
    if(!title || !description){
        throw new ApiError(401,"All fields are required")
    }
    // console.log(req.files)

    const videoFileLocalPath = req.files?.videoFile[0].path
    if(!videoFileLocalPath){
        throw new ApiError(401,"Video file is required")
    }

    const thumbnailLocalPath= req.files?.thumbnail[0].path
    if(!thumbnailLocalPath){
        throw new ApiError(401,"Thumbnail is required")
    }
    let videoFile=""
    if(req.files.videoFile[0].size<=100*1024*1024){
        videoFile = await uploadOnCloudinary(videoFileLocalPath)
    }
    else{
        throw new ApiError(400,"Video should be less than or equal to 100MB")

    }
    const thumbnail= await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(400,"Error while uploading the video")
    }
    if(!thumbnail){
        throw new ApiError(400,"Error while uploading the thumbnail")
    }

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const video = await Video.create({
        videoFile:{
            url: videoFile.url,
            secure_url :videoFile.secure_url,
            public_id: videoFile.public_id
        },
        thumbnail:{
            url:thumbnail.url,
            secure_url:thumbnail.secure_url,
            public_id:thumbnail.public_id
        },
        title:title,
        description,
        duration: videoFile.duration,
        views:0,
        owner:user._id
    })

    const createdVideo= await Video.findById(video._id)
    if(!createdVideo){
        throw new ApiError(400,"Somenthing went worng while publishing")
    }
    res.status(200).json(new ApiResponse(200,createdVideo,"Video Published Successfully"))
})

const getAllvideos= asyncHandler(async(req,res)=>{
    const{page=1 , limit=10, query , sortBy,sortType, userId}= req.query

    if(!isValidObjectId(userId)){
        throw new ApiError(401, "Invalid User Id")
    }
    if(!query|| !sortBy || !sortType){
        throw new ApiError(400,"All Fields are required")
    }

    const user = User.findById(userId)
    if(!user){
        throw new ApiError(400,"User not found")
    }
    const options= {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    await Video.createIndexes({
        title:"text",
        description:"text"
    })

    const allVideos= Video.aggregate([
        {
            $match:{
                $text :{
                    $search:query
                }
            }
        },
        {
            $sort:{
                score:{
                    $meta:"textScore"
                },
                [sortBy]:sortType ==='asc'?1 :-1

            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[{
                    $project:{
                        fullName:1,
                        username:1,
                        avatar:1
                    }
                }]
            }
        }
    ])

    try {
        const listVideos= await Video.aggregatePaginate(allVideos,options)
        if(listVideos.docs.length===0){
            res.status(200).json(new ApiResponse(200,{},"User do not have Videos"))
        }
        res.status(200).json(new ApiResponse(200,{},"Video List successfully listed"))
    } catch (error) {
        throw new ApiError(400, error.message || "Something Went Wrong....")
    }
})

const getVideoById= asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }
    const isVideoExist= await Video.findById(videoId)
    if(!isVideoExist){
        throw new ApiError(400,"Video Does Not Exist")
    }
    const video= await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"_id",
                as:"video"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from: "likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $lookup:{
                from: "comments",
                localField:"owner",
                foreignField:"_id",
                as:"comments"
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[{
                    $project:[{
                        fullName:1,
                        username:1,
                        avatar:1
                    }]
                }]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                },
                subscribersCount:{
                    $size:"$subscribers"
                },
                likesCount:{
                    $size :"$likes"
                },
                commentsCount:{
                    $size: "$comments"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                },
                video:{
                    $first:"$video"
                }
            }
        },
        {
            $project:{
                video:1,
                owner:1,
                subscribersCount:1,
                likesCount:1,
                commentsCount:1,
                isSubscribed:1,
                comments:1
            }
        }
    ])

    console.log("VIDEO DETAILS",video);
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(new ApiResponse(200,video,"Video Listed Successfully"))


})


export {
    publishVideo,
getAllvideos,
getVideoById,

}