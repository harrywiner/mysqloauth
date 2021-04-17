const { InsertUser } = require('../src/sql')
const sql_tools = require('../src/sql')
const bcrypt = require('bcrypt')

test('test 1 is equal to 1', () => {
    expect(1).toBe(1)
})

// Create Test
test('Create User', () => {

    email = "harry at beans.guru"
    password = "password"
    bcrypt.hash(password, 10, async function (err, hash) {
        if (err)
            throw err
        // TODO GraphQL insertUser query
        result = await sql_tools.InsertUser({ email: email, hash: hash })



    });

})


