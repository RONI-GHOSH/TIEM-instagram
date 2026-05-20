const express = require('express')
const router = express.Router()
const { resetDatabase } = require('../controllers/dbController')
router.post('/reset', resetDatabase)
module.exports = router
