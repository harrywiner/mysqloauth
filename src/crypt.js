const bcrypt = require('bcrypt');
const saltRounds = 10
const express = require('express')
var jwt = require('jsonwebtoken');
var app = express()
const PORT = 4444
app.use(express.static(__dirname + "/public"))

app.listen(PORT, () => console.log("Listening on " + PORT));

var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
const { check } = require('yargs');

var keypair = require('keypair');
const pair = keypair();
require('dotenv').config();


const tools = require('./tools')
const sql_tools = require('./sql')



// GRAPHQL

var dummyData = [
    {
        email: "winer.harry at gmail.com",
        pwd: "password",
        type: 1
    },
    {
        email: "emma at emms.io",
        pwd: "BeastFromTheEast",
        type: 1
    },
    {
        email: "alice.lankester at gmail.com",
        pwd: "password123",
        type: 0
    },
    {
        email: "winer.peter at gmail.com",
        pwd: "ILoveDrampa",
        type: 0
    }
]

// GRAPHQL

// build schema
// 

function getUser(args) {
    var email = args.email
    return dummyData.filter(user => {
        return user.email === email;
    })[0]
}

function checkPassword({ email, pwd }) {

    return (typeof dummyData.filter(user => {
        if (user.email === email) {
            if (checkHash(pwd, user.pwd)) {
                return true
            }
        }
    })[0] != undefined)
}


/**
 * SQL version, may change to connect itself
 * @param {email, password} email and password in **plaintext** 
 */
async function authenticateUser({ email, password }) {

    // TODO replace with graphql 
    return new Promise(async (resolve, reject) => {
        hash = await sql_tools.GetPasswordHash({ email: email })

        checkHash(password, hash)
            .then((result) => {
                resolve(result)
            }).catch(err => {
                reject(err)
            })
    })

}

async function userExists(email, con) {
    query = `SELECT * from users where email like ?`
    inputs = [email]
    query = con.format(query, inputs)

    return new Promise((resolve, reject) => {
        con.query(query, (err, results, fields) => {
            if (err) {
                reject(error)
            }
            if (results[0]) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

function SQLInsertUser({ email, hash }) {
    return new Promise((resolve, reject) => {
        query = `insert into users (email, password) values (?, ?);`
        inputs = [email, hash]
        query = con.format(query, inputs)
        con.query(query, function (error, results, fields) {
            if (error) {
                throw error
            }

            if (results.affectedRows === 1) {
                // if the data has been entered successfully
                resolve({ success: true, userID: results.insertId })
            } else {
                reject({ success: false, err: "row mismatch in createUser" })
            }

        })
    })

}

/**
 * SQL VERSION
 * @param {String} email
 * @param {String} pwd **plaintext**
 */
async function createUser({ email, password }, options) {
    con = await tools.DBConnect("accounts")
    return new Promise(async (resolve, reject) => {
        // TODO replace with graphql
        exists = await userExists(email, con)
        if (exists) {
            reject({ success: false, err: "Email already exists" })
        } else {
            bcrypt.hash(password, saltRounds, async function (err, hash) {
                if (err)
                    throw err
                // TODO GraphQL insertUser query
                result = await SQLInsertUser({ email, hash })
                if (result.success) {
                    resolve(result)
                } else {
                    reject(result)
                }
            });
        }
    })
}

async function checkHash(password, hash) {
    return new Promise((resolve, reject) => {
        if (password && hash) {

            bcrypt.compare(password, hash, function (err, result) {
                // result == true
                if (err)
                    throw err
                resolve(result)
            })
        } else {
            console.error("fields missing in checkHash")
            reject("fields missing")
        }
    })


}

// auth API

// TODO change to specified algorithm and specified token lifespan
function GenerateToken(data) {
    return new Promise((resolve, reject) => {
        resolve(jwt.sign({ id: data }, pair.private, {
            expiresIn: 86400, // expires in 24 hours
            algorithm: 'RS256'
        }))
    })
}


app.post('/login', async function (req, res) {
    email = req.headers.email
    password = req.headers.password

    // TODO change to graphql
    authorised = await authenticateUser({ email: email, password: password })

    if (authorised) {
        GenerateToken(email)
            .then((token) => {
                res.send({ success: true, token: token })
            }).catch((err) => {
                res.send({ success: false, err: err })
            })
    } else {
        res.send({ success: false, err: "failed to authenticate" })
    }
})

app.post('/register', async function (req, res) {

    email = req.headers.email
    password = req.headers.password

    // TODO change to graphql
    createUser({ email, password }).then((result) => {
        if (result.success) {
            var token = jwt.sign({ id: result.userID }, pair.private, {
                expiresIn: 86400, // expires in 24 hours
                algorithm: 'RS256'
            })
            res.status(200).send({ auth: true, token: token });
        }
    }).catch((result) => {
        console.log("error in /register" + result.err)
        res.send({ success: false, err: result.err })
    })
});


app.post('/me', (req, res) => {
    var token = req.headers['authorization'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, pair.public, { algorithms: ['RS256'] }, function (err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

        res.status(200).send(decoded);
    });
})

function VerifyToken(req, res, next) {
    var token = req.headers['authorization'];
    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, pair.public, function (err, decoded) {
        if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

        // if everything good, save to request for use in other routes
        req.userId = decoded.id;
        next();
    });
}

app.post('/hello', VerifyToken, (req, res) => {
    myName = req.query.name
    res.send(`Hello ${myName}!`)
})









module.exports = {
    VerifyToken: VerifyToken,
    router: app
}
