const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken', 'otp', 'otpExpires'] }
  });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({
    success: true,
    data: user
  });
});
const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, bio, department, year, semester, is_private } = req.body.body || req.body;
  const user = await User.findByPk(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (full_name) user.full_name = full_name;
  if (bio !== undefined) user.bio = bio;
  if (department) user.department = department;
  if (year) user.year = year;
  if (semester) user.semester = semester;
  if (is_private !== undefined) user.is_private = is_private;
  await user.save();
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
        full_name: user.full_name,
        bio: user.bio,
        department: user.department,
        year: user.year,
        semester: user.semester,
        is_private: user.is_private
    }
  });
});
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }
  const user = await User.findByPk(req.user.id);
  user.avatar_url = req.file.path;
  await user.save();
  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      avatar_url: user.avatar_url
    }
  });
});
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (user.avatar_url) {
    user.avatar_url = null;
    await user.save();
  }
  res.json({
    success: true,
    message: 'Avatar removed successfully'
  });
});
const Block = require('../models/Block');
const { Op } = require('sequelize');
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: { username: req.params.username },
    attributes: ['id', 'username', 'full_name', 'avatar_url', 'bio', 'department', 'year', 'semester', 'is_private']
  });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const isBlocked = await Block.findOne({
    where: {
      [Op.or]: [
        { blockerId: req.user.id, blockedId: user.id },
        { blockerId: user.id, blockedId: req.user.id }
      ]
    }
  });
  if (isBlocked) {
    res.status(403);
    throw new Error('User has blocked you or is blocked by you');
  }
  res.json({
    success: true,
    data: user
  });
});
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const getProfileStats = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const followersCount = await Follow.count({ where: { followingId: user.id, status: 'accepted' } });
  const followingCount = await Follow.count({ where: { followerId: user.id, status: 'accepted' } });
  const postsCount = await Post.count({ where: { userId: user.id } });
  res.json({
    success: true,
    data: {
      posts_count: postsCount,
      followers_count: followersCount,
      following_count: followingCount
    }
  });
});
const getProfileCompleteness = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const fieldsToCheck = [
    { name: 'full_name', value: user.full_name, required: true },
    { name: 'department', value: user.department, required: true },
    { name: 'year', value: user.year, required: true },
    { name: 'semester', value: user.semester, required: true },
    { name: 'bio', value: user.bio, required: false },
    { name: 'avatar_url', value: user.avatar_url, required: false }
  ];
  const status = fieldsToCheck.map(field => ({
    field: field.name,
    filled: field.value !== null && field.value !== undefined && field.value !== '',
    required: field.required
  }));
  const filledCount = status.filter(f => f.filled).length;
  const totalCount = fieldsToCheck.length;
  const percentage = Math.round((filledCount / totalCount) * 100);
  const is_complete = status.filter(f => f.required).every(f => f.filled);
  res.json({
    success: true,
    data: {
      is_complete,
      percentage,
      details: status
    }
  });
});
module.exports = {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  getPublicProfile,
  getProfileStats,
  getProfileCompleteness,
};
