const express = require('express');
const router = express.Router();
const { searchUsers, searchAll, searchPosts, findExactUser } = require('../controllers/searchController')
const { protect } = require('../middleware/authMiddleware')
router.use(protect);
router.get('/', searchAll);
router.get('/users', searchUsers);
router.get('/posts', searchPosts);
router.get('/users/exact', findExactUser);
module.exports = router;
