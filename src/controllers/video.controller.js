import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideosByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const videos = await Video.find({ owner: user.id });
  res.json(new ApiResponse(videos));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  const video = new Video({ title, description, owner: req.user.id });

  try {
    const videoUploadResult = await uploadOnCloudinary(videoLocalPath);

    if (!videoUploadResult.url) {
      throw new ApiError(500, "Failed to upload video to Cloudinary");
    }

    video.videoFile = videoUploadResult.url;
    video.duration = videoUploadResult.duration || 0;

    if (thumbnailLocalPath) {
      const thumbnailUploadResult = await uploadOnCloudinary(
        thumbnailLocalPath
      );

      if (!thumbnailUploadResult.url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
      }
      video.thumbnail = thumbnailUploadResult.url;
    } else {
      video.thumbnail = null;
    }

    await video.save();
    res.json(new ApiResponse(video, 201));
  } catch (error) {
    throw new ApiError(500, `Error uploading files: ${error.message}`);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Video not found");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  res.json(new ApiResponse(video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Video not found");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (req.user.id !== video.owner.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }
  const { title, description } = req.body;
  video.title = title;
  video.description = description;
  if (req.files.thumbnail) {
    const result = await uploadOnCloudinary(req.files.thumbnail);
    video.thumbnail = result.secure_url;
  }
  await video.save();
  res.json(new ApiResponse(video));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Video not found");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (req.user.id !== video.owner.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }
  await video.remove();
  res.json(new ApiResponse(null, 204));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Video not found");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (req.user.id !== video.owner.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }
  video.isPublished = !video.isPublished;
  await video.save();
  res.json(new ApiResponse(video));
});

export {
  getAllVideosByUsername,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
