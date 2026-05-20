const asyncHandler = require('express-async-handler');
const { Op, Sequelize } = require('sequelize');
const User = require('../models/User');
const Post = require('../models/Post');
const PostMedia = require('../models/PostMedia');
const Like = require('../models/Like');

const formatPostResult = (post, userId) => {
  const postJson = typeof post.toJSON === 'function' ? post.toJSON() : post;
  const likes_count = postJson.Likes ? postJson.Likes.length : 0;
  const is_liked = postJson.Likes ? postJson.Likes.some(like => like.userId === userId) : false;
  return {
    ...postJson,
    likes_count,
    is_liked
  };
};

const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }
  const users = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.iLike]: `%${q}%` } },
        { full_name: { [Op.iLike]: `%${q}%` } }
      ]
    },
    attributes: ['username', 'full_name', 'avatar_url', 'department', 'year'],
    limit: 20
  });
  res.json({
    success: true,
    data: users
  });
});

const searchPosts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const posts = await Post.findAll({
    where: {
      is_public: true,
      [Op.or]: [
        { caption: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
        Sequelize.where(
          Sequelize.fn('array_to_string', Sequelize.col('tags'), ' '),
          { [Op.iLike]: `%${q}%` }
        ),
        Sequelize.where(
          Sequelize.fn('concat',
            Sequelize.fn('COALESCE', Sequelize.col('caption'), ''),
            ' ',
            Sequelize.fn('COALESCE', Sequelize.col('location'), ''),
            ' ',
            Sequelize.fn('COALESCE', Sequelize.fn('array_to_string', Sequelize.col('tags'), ' '), '')
          ),
          { [Op.iLike]: `%${q}%` }
        )
      ]
    },
    include: [
      {
        model: User,
        attributes: ['username', 'full_name', 'avatar_url']
      },
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: 20,
    distinct: true,
    subQuery: false
  });

  res.json({
    success: true,
    data: posts.map(post => formatPostResult(post, req.user.id))
  });
});

const searchAll = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const users = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.iLike]: `%${q}%` } },
        { full_name: { [Op.iLike]: `%${q}%` } }
      ]
    },
    attributes: ['username', 'full_name', 'avatar_url', 'department', 'year'],
    limit: 20
  });

  const posts = await Post.findAll({
    where: {
      is_public: true,
      [Op.or]: [
        { caption: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
        Sequelize.where(
          Sequelize.fn('array_to_string', Sequelize.col('tags'), ' '),
          {
            [Op.iLike]: `%${q}%`
          }
        ),
        Sequelize.where(
          Sequelize.fn('concat',
            Sequelize.fn('COALESCE', Sequelize.col('caption'), ''),
            ' ',
            Sequelize.fn('COALESCE', Sequelize.col('location'), ''),
            ' ',
            Sequelize.fn('COALESCE', Sequelize.fn('array_to_string', Sequelize.col('tags'), ' '), '')
          ),
          {
            [Op.iLike]: `%${q}%`
          }
        )
      ]
    },
    include: [
      {
        model: User,
        attributes: ['username', 'full_name', 'avatar_url']
      },
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: 20,
    distinct: true,
    subQuery: false
  });

  res.json({
    success: true,
    data: {
      users,
      posts: posts.map(post => formatPostResult(post, req.user.id))
    }
  });
});

const findExactUser = asyncHandler(async (req, res) => {
  const { username } = req.query;
  if (!username) {
    res.status(400);
    throw new Error('Username is required');
  }
  const user = await User.findOne({
    where: { username },
    attributes: ['username', 'full_name', 'avatar_url', 'department', 'year', 'is_private']
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

module.exports = {
  searchUsers,
  searchAll,
  searchPosts,
  findExactUser
};
