import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";

const addComment= asyncHandler(async(req,res)=>{
    const {videoId}= req.params
    const{content} = req.body

    const user= User.findById(req.user?._id)

    if(!user){
        throw new ApiError(404,"User not found")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(402,"Invalid video Id")
    }

    const video= await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,'Video Not Found')
    }
    if(!content){
        throw new ApiError(400,'Content field cannot be empty')
    }
    const comment= await Comment.create(
        {
            content,
            video: videoId,
            owner: user?._id
    })

    if(!comment){
        throw new ApiError(401,"Error while creating comment")
    }

    return res.status(200).json(new ApiResponse(200,comment, "Comment Created Successfully"))
})

const updateComment= asyncHandler(async(req,res)=>{
    const {commentId}= req.params
    const {content}= req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(402,"Invalid video Id")
    }
    if(!content){
        throw new ApiError(400,'Enter comment')
    }
    const updatedComment= await Comment.findByIdAndUpdate(commentId,{
        $set:{content}
    },{new:true})

    if(!updatedComment){
        throw new ApiError(404,"Error while updating comment.")
    }
    return res.status(200).json(new ApiResponse(200,updatedComment,"Comment updated successfully"))
})

const deleteComment= asyncHandler(async(req,res)=>{
    const {commentId}= req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(402,"Invalid comment Id")
    }

    const deletedComment= await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(402,"Error while deleting comment")
    }

    return res.status(200).json(new ApiResponse(200,deletedComment,"Comment deleted successfully"))
})

const getVideoComments= asyncHandler(async(req,res)=>{
    const {videoId}= req.params
    const{page=1, limit=10}= req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(402,"Invalid video id")
    }

    const isVideoExists= await Video.findById(videoId)
    if(!isVideoExists){
        throw new ApiError(404,"Video not found")
    }
    const options= {
        page: parseInt(page),
        limit:parseInt(limit)
    }

    const allComments= Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ])
    try {
        const listComments= await Comment.aggregatePaginate(allComments,options)

        if(listComments.docs.length===0){
            return res.status(200).json(new ApiResponse(200,{},"No comments yet"))
        }
        return res.status(200).json(new ApiResponse(200,listComments,"Comments fetched successfully"))
    } catch (error) {
        throw new ApiError(401,"Error while loading comments")
    }
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}