const bcrypt = require('bcrypt');
const saltRounds = 10
const express = require('express')
var jwt = require('jsonwebtoken');
var app = express()
const PORT = 5647
app.use(express.static(__dirname + "/public"))

// const fs = require('fs')
// const util = require('util')
// var pair = {}
// new Promise(async (resolve, reject) => {
//     const readFile = util.promisify(fs.readFile)
//     private = await readFile(__dirname + '/../keys/jack-auth', 'utf8')
//     public = await readFile(__dirname + '/../keys/jack-auth.pub', 'utf8')
//     resolve({ private, public })
// }).then((data) => {
//     pair = data
//     if (pair.private && pair.public)
//         console.log("success!")
//     else
//         console.log("key failure")
// }).catch(err => {
//     console.log(err)
// })

const keypair = require('keypair');
const pair = keypair()

require('dotenv').config();


const tools = require('./tools')

/**
 * SQL version, may change to connect itself
 * @param {email, password} email and password in **plaintext** 
 * @returns {authenticated: bool, reason: String}
 * If the user is not authenticated the reason will state why 
 */
async function authenticateUser({ email, password }) {

    con = await tools.DBConnect('accounts')
    // TODO replace with graphql 
    return new Promise(async (resolve, reject) => {
        tools.getUser(email).then(({ err, user }) => {
            if (err)
                throw err
            else if (!user)
                resolve({ authenticated: false, reason: "user not found" })
            else
                checkHash(password, user.password)
                    .then((result) => {
                        resolve({ authenticated: true, reason: "" })
                    }).catch(err => {
                        throw err
                    })
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
        user = await tools.getUser(email)
        if (!user) {
            reject({ success: false, err: "Email already exists" })
        } else {
            bcrypt.hash(password, saltRounds, async function (err, hash) {
                if (err)
                    throw err
                // TODO GraphQL insertUser query
                result = await tools.InsertUser({ email, hash })
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
        console.log("error in /register: " + result.err)
        res.send({ success: false, err: result.err })
    })
});


// PASSPORT 
const LocalStrategy = require('passport-local').Strategy

function PassportConfig(passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email',
    },
        async function (email, password, done) {
            console.log("in passport verify")
            tools.getUser(email).then(async ({ err, user }) => {
                if (!(typeof err != null)) {
                    return done(err);
                }
                if (!user) { return done(null, false); }
                if (await checkHash(password, user.password)) {
                    return done(null, user)
                }
                return done(null, false)
            }).catch(err => console.log("Passport-local Error: " + err.message))
        }
    ));

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        tools.getUserByID(id).then(({ err, user }) => {
            done(err, user)
        })
    });
}

// TODO implement authorisation bearer https://developer.okta.com/blog/2018/08/21/build-secure-rest-api-with-node

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

// put as second parameter before guarded page
function EnsureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
// put at login to check if user is already logged in 
function ForwardAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/dashboard');
}

// if the user is authenticated then assign their session a token
async function AssignToken(req, res, next) {
    if (!req.isAuthenticated())
        return next()

    var id = req.session.passport.user
    var token = await GenerateToken(id).catch(err => console.log("error creating token"))
    req.session.token = token
    return next()
}

app.post('/hello', VerifyToken, (req, res) => {
    myName = req.query.name
    res.send(`Hello ${myName}!`)
})

module.exports = {
    VerifyToken,
    router: app,
    PORT,
    PassportConfig,
    EnsureAuthenticated,
    ForwardAuthenticated,
    AssignToken
}

app.listen(PORT, () => console.log("Auth listening on " + PORT));
