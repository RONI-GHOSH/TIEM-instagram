const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Block = require('../models/Block');
const { Op } = require('sequelize');
const followUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }
  if (targetUser.id === req.user.id) {
    res.status(400);
    throw new Error('You cannot follow yourself');
  }
  const isBlocked = await Block.findOne({
    where: {
      [Op.or]: [
        { blockerId: req.user.id, blockedId: targetUser.id },
        { blockerId: targetUser.id, blockedId: req.user.id }
      ]
    }
  });
  if (isBlocked) {
    res.status(403);
    throw new Error('Action not allowed');
  }
  const existingFollow = await Follow.findOne({
    where: { followerId: req.user.id, followingId: targetUser.id }
  });
  if (existingFollow) {
    res.status(400);
    throw new Error('Already following or request pending');
  }
  const status = targetUser.is_private ? 'pending' : 'accepted';
  await Follow.create({
    followerId: req.user.id,
    followingId: targetUser.id,
    status
  });
  res.status(200).json({
    success: true,
    message: status === 'pending' ? 'Follow request sent' : 'User followed',
    requested: status === 'pending'
  });
});

const getFollowStatus = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }
  if (targetUser.id === req.user.id) {
    return res.json({
      success: true,
      data: {
        self: true,
        following: false,
        requested: false,
        status: 'self'
      }
    });
  }

  const follow = await Follow.findOne({
    where: { followerId: req.user.id, followingId: targetUser.id }
  });

  if (!follow) {
    return res.json({
      success: true,
      data: {
        following: false,
        requested: false,
        status: 'none'
      }
    });
  }

  res.json({
    success: true,
    data: {
      following: follow.status === 'accepted',
      requested: follow.status === 'pending',
      status: follow.status
    }
  });
});
const unfollowUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }
  const follow = await Follow.findOne({
    where: { followerId: req.user.id, followingId: targetUser.id }
  });
  if (!follow) {
    res.status(400);
    throw new Error('You are not following this user');
  }
  await follow.destroy();
  res.status(200).json({ success: true, message: 'User unfollowed' });
});
const acceptFollowRequest = asyncHandler(async (req, res) => {
  const requester = await User.findOne({ where: { username: req.params.username } });
  if (!requester) {
    res.status(404);
    throw new Error('User not found');
  }
  const follow = await Follow.findOne({
    where: { followerId: requester.id, followingId: req.user.id, status: 'pending' }
  });
  if (!follow) {
    res.status(404);
    throw new Error('Follow request not found');
  }
  follow.status = 'accepted';
  await follow.save();
  res.status(200).json({ success: true, message: 'Follow request accepted' });
});
const rejectFollowRequest = asyncHandler(async (req, res) => {
  const requester = await User.findOne({ where: { username: req.params.username } });
  if (!requester) {
    res.status(404);
    throw new Error('User not found');
  }
  const follow = await Follow.findOne({
    where: { followerId: requester.id, followingId: req.user.id, status: 'pending' }
  });
  if (!follow) {
    res.status(404);
    throw new Error('Follow request not found');
  }
  await follow.destroy();
  res.status(200).json({ success: true, message: 'Follow request rejected' });
});
const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const follows = await Follow.findAll({
    where: { followingId: user.id, status: 'accepted' },
  });
  const followerIds = follows.map(f => f.followerId);
  const followers = await User.findAll({
    where: { id: followerIds },
    attributes: ['username', 'full_name', 'avatar_url']
  });
  res.json({ success: true, data: followers });
});
const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const follows = await Follow.findAll({
    where: { followerId: user.id, status: 'accepted' }
  });
  const followingIds = follows.map(f => f.followingId);
  const following = await User.findAll({
    where: { id: followingIds },
    attributes: ['username', 'full_name', 'avatar_url']
  });
  res.json({ success: true, data: following });
});
const blockUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }
  if (targetUser.id === req.user.id) {
    res.status(400);
    throw new Error('You cannot block yourself');
  }
  const existingBlock = await Block.findOne({
    where: { blockerId: req.user.id, blockedId: targetUser.id }
  });
  if (existingBlock) {
    res.status(400);
    throw new Error('User already blocked');
  }
  await Block.create({ blockerId: req.user.id, blockedId: targetUser.id });
  await Follow.destroy({
    where: {
      [Op.or]: [
        { followerId: req.user.id, followingId: targetUser.id },
        { followerId: targetUser.id, followingId: req.user.id }
      ]
    }
  });
  res.status(200).json({ success: true, message: 'User blocked' });
});
const unblockUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }
  const block = await Block.findOne({
    where: { blockerId: req.user.id, blockedId: targetUser.id }
  });
  if (!block) {
    res.status(400);
    throw new Error('User not blocked');
  }
  await block.destroy();
  res.status(200).json({ success: true, message: 'User unblocked' });
});
const getBlockedList = asyncHandler(async (req, res) => {
  const blocks = await Block.findAll({ where: { blockerId: req.user.id } });
  const blockedIds = blocks.map(b => b.blockedId);
  const blockedUsers = await User.findAll({
    where: { id: blockedIds },
    attributes: ['username', 'full_name', 'avatar_url']
  });
  res.json({ success: true, data: blockedUsers });
});
const getPendingRequests = asyncHandler(async (req, res) => {
  const follows = await Follow.findAll({
    where: { followingId: req.user.id, status: 'pending' }
  });
  const requesterIds = follows.map(f => f.followerId);
  const requesters = await User.findAll({
    where: { id: requesterIds },
    attributes: ['username', 'full_name', 'avatar_url']
  });
  res.json({ success: true, data: requesters });
});

const getSuggestedUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  
  const following = await Follow.findAll({
    where: { followerId: req.user.id, status: 'accepted' },
    attributes: ['followingId']
  });
  const followingIds = following.map(f => f.followingId);
  
  const blocked = await Block.findAll({
    where: {
      [Op.or]: [
        { blockerId: req.user.id },
        { blockedId: req.user.id }
      ]
    }
  });
  const blockedIds = blocked.map(b => 
    b.blockerId === req.user.id ? b.blockedId : b.blockerId
  );
  const excludeIds = [req.user.id, ...followingIds, ...blockedIds];

  // Suggest users from contacts-of-contacts first
  let suggestedUsers = [];
  if (followingIds.length > 0) {
    const connectionFollows = await Follow.findAll({
      where: {
        followerId: followingIds,
        status: 'accepted',
        followingId: { [Op.notIn]: excludeIds }
      },
      attributes: ['followingId']
    });
    const connectionIds = [...new Set(connectionFollows.map(f => f.followingId))];

    if (connectionIds.length > 0) {
      suggestedUsers = await User.findAll({
        where: { id: connectionIds },
        attributes: ['id', 'username', 'full_name', 'avatar_url', 'bio', 'department', 'year'],
        order: [['createdAt', 'DESC']],
        limit,
        raw: false
      });
    }
  }

  // Fallback to public users if no connected suggestions exist or the list is smaller than limit
  if (suggestedUsers.length < limit) {
    const fallbackLimit = limit - suggestedUsers.length;
    const publicUsers = await User.findAll({
      where: {
        id: { [Op.notIn]: excludeIds },
        is_private: false
      },
      attributes: ['id', 'username', 'full_name', 'avatar_url', 'bio', 'department', 'year'],
      order: [['createdAt', 'DESC']],
      limit: fallbackLimit,
      raw: false
    });

    const existingIds = new Set(suggestedUsers.map(u => u.id));
    suggestedUsers = [
      ...suggestedUsers,
      ...publicUsers.filter(u => !existingIds.has(u.id))
    ];
  }

  const suggestedWithStats = await Promise.all(
    suggestedUsers.map(async (user) => {
      const followerCount = await Follow.count({
        where: { followingId: user.id, status: 'accepted' }
      });
      return {
        ...user.toJSON(),
        followers_count: followerCount
      };
    })
  );

  suggestedWithStats.sort((a, b) => b.followers_count - a.followers_count);

  res.status(200).json({ 
    success: true, 
    data: suggestedWithStats 
  });
});

module.exports = {
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  getBlockedList,
  getPendingRequests,
  getSuggestedUsers,
  getFollowStatus,
};
