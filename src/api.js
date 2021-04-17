const express = require('express')
const { VerifyToken } = require('./auth')

const cors = require('cors')
const router = express()

router.use(cors({
    origin: "*"
}))
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Your API endpoints here

router.post('/hello', VerifyToken, (req, res) => {
    res.send(`Hello ${req.body.name}!`)
})

router.listen(9000, () => console.log("API listening on 9000"))

module.exports = router