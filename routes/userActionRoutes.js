const express = require('express')
const router = express.Router();
const {
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
} = require('../controllers/userActionController');
const { getUserPosts } = require('../controllers/postController')
const { getUserActiveStories } = require('../controllers/storyController')
const { protect } = require('../middleware/authMiddleware')
router.use(protect);
router.get('/suggested', getSuggestedUsers);
router.get('/:username/posts', getUserPosts)
router.get('/:username/stories', getUserActiveStories)
router.get('/me/blocked', getBlockedList)
router.get('/me/follow-requests', getPendingRequests)
router.get('/:username/follow-status', getFollowStatus)
router.post('/:username/follow', followUser)
router.delete('/:username/follow', unfollowUser)
router.post('/:username/follow/accept', acceptFollowRequest)
router.delete('/:username/follow/reject', rejectFollowRequest)
router.get('/:username/followers', getFollowers)
router.get('/:username/following', getFollowing)
router.post('/:username/block', blockUser)
router.delete('/:username/block', unblockUser)
module.exports = router;
