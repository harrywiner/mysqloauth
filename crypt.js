const bcrypt = require('bcrypt');
const plaintextpwd = 'BigTiddy69'
const otherpwd = 'smallbooby420' // an inferior password 
const saltRounds = 10
const express = require('express')
const request = require('request')
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



// GRAPHQL

var dummyData = [
    {
        email: "winer.harry at gmail.com",
        pwd: "password",
        type: 1
    },
    {
        email: "emma at emms.io",
        pwd: "gradydog",
        type: 1
    },
    {
        email: "alice.lankester at gmail.com",
        pwd: "secret",
        type: 0
    },
    {
        email: "winer.peter at gmail.com",
        pwd: "ILoveDrampa",
        type: 0
    }
]

// encrypt passwords 
dummyData.map(async (user) => {
    password = user.pwd
    await bcrypt.hash(password, saltRounds, function (err, hash) {
        // Store hash in your password DB.
        console.log(hash)
        if (err)
            throw err
        user.pwd = hash
    });
    return user
})

// GRAPHQL

// build schema
// 
var schema = buildSchema(`
    type Query {
      message: String
      getPrivelage(type: Int!): [User]
      getUser(email: String!): User
      checkPassword(email: String!, pwd: String!): Boolean
    }, 
    type Mutation {
      resetPassword(email: String!, pwd: String!, newpwd: String!): User
      createUser(email: String!, pwd: String!): User
    },
    type User {
      email: String
      pwd: String
      type: Int
    }
  `)

// methods
function getUser(args) {
    var email = args.email
    return dummyData.filter(user => {
        return user.email === email;
    })[0]
}

function getUsersByPrivelage(args) {
    var type = args.type
    return dummyData.filter(user => {
        return user.type == type
    })
}

function changePwd({ email, pwd, newpwd }) {
    dummyData.map(user => {
        if (user.email === email && user.pwd == pwd) {
            user.pwd = newpwd
            return user
        }
    })

    return dummyData.filter(user => {
        return user.email === email
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

async function checkHash(password, hash) {
    return bcrypt.compare(password, hash, function (err, result) {
        // result == true
        return result
    });
}


// root resolver
var root = {
    message: () => { console.log("hello world"); return 'Hello World!' },
    getUser: getUser,
    getPrivelage: getUsersByPrivelage,
    resetPassword: changePwd,
    checkPassword: checkPassword
}

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}))

// auth API

app.post('/register', function (req, res) {

    var hashedPassword = bcrypt.hashSync(req.query.password, 8);

    user = {
        email: req.query.email,
        password: hashedPassword
    }

    // insert user into Database

    dummyData.push(user)

    var token = jwt.sign({ id: user.email }, pair.private, {
        expiresIn: 86400, // expires in 24 hours
        algorithm: 'RS256'
    })
    res.status(200).send({ auth: true, token: token });
});


app.post('/me', (req, res) => {
    var token = req.headers['authorization'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, pair.public, { algorithms: ['RS256'] }, function (err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

        res.status(200).send(decoded);
    });
})









module.exports = {
    CheckAuth: (username, password) => {

    }
}
