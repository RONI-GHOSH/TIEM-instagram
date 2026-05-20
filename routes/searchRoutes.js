const express = require('express');
const router = express.Router();
const { searchUsers, searchAll, findExactUser } = require('../controllers/searchController')
const { protect } = require('../middleware/authMiddleware')
router.use(protect);
router.get('/', searchAll);
router.get('/users', searchUsers);
router.get('/users/exact', findExactUser);
module.exports = router;
