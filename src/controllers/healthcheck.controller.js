import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async(req,res)=>{
    res.staus(200).json(new ApiResponse(200,{},"Server is up and running"))
})

export{healthCheck}