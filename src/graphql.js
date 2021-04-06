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