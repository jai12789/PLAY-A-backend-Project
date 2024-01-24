import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlaylist = asyncHandler(async(req,res)=>{
    const {name, description}= req.body
    const{videoId}= req.params
    if([name,description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,'Please provide all the fields')
    }

    const user = await user.findById(req.user?._id)
    if(!user){
        throw new ApiError(404,"user not found")
    }

    let playlistData={
        name:name,
        description: description,
        owner: user?._id
    }
    if(videoId && isValidObjectId(videoId)){
        const isVideoExist=await Video.findById(videoId)
        if(isVideoExist){
            playlistData.videos= [videoId]
        }
        else{
            throw new ApiError(404,"Video not found")
        }
    }

    const playlist= await Playlist.create(playlistData)
    if(!playlist){
        throw new ApiError(404,"Error occured while creating playlist")
    }
    res.status(200).json(new ApiResponse(playlist,"Playlist created Successfully"))
})

const addvideoToPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId,videoId}= req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    const isVideoExist= await Video.findById(videoId)
    if(!isVideoExist){
        throw new ApiError(404,"Video not found")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id")
    }
    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
            $addToSet:{
                video:videoId
            }
        },{new:true})

        if(!updatedPlaylist){
            throw new ApiError(404,"Playlist not found")
        }

        return res.status(200).json(new ApiResponse(200,updatedPlaylist,"video added to playlist successfully"))
    } catch (error) {
        throw new ApiError(401,error.message)
    }
})

const removeVideoFromPlaylist= asyncHandler(async(req,res)=>{
    const {playlistId,videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    const isVideoExist= await Video.findById(videoId)

    if(!isVideoExist){
        throw new ApiError(404,"Video not found")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }
    try {
        const updatedPlaylist= await Playlist.findByIdAndUpdate(playlistId,{
            $pull:{videos:videoId}
        },{new: true})
        
        if(!updatedPlaylist){
            throw new ApiError(404,"playlist not found")
        }

        res.status(200).json(new ApiResponse(200,updatedPlaylist,"Video removed from playlist"))
    } catch (error) {
        throw new ApiError(401,error.message)
    }
})

const deletePlaylist= asyncHandler(async(req,res)=>{
    const{playlistId}= req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist id")
    }
    try {
        const playlistDelete= await Playlist.findByIdAndDelete(playlistId)

        if(!playlistDelete){
            throw new ApiError(404,"No playlist Found!")
        }
        res.status(200).json(new ApiResponse(200,{},"Playlist deleted successfully"))
    } catch (error) {
        throw new ApiError(500,"Error occured while deleting playlist")
    }
})

const upadatePlaylist= asyncHandler(async(req,res)=>{
    const{playlistId}= req.params
    const{name , description}= req.body

    if(!name || !description){
        throw new ApiError(400,"Invalid playlist id")
    }

    try {
        //updating playlist here 
    } catch (error) {
        // Error message throw
    }
})

export {
    createPlaylist,
    addvideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist, 
    upadatePlaylist
}