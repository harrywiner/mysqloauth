const axios = require('axios')
const PORT = 3333
const URL = `http://localhost:${PORT}`
/**
 * For these tests to work the following credentials have to exist in the database
 */

user = {
    email: "winer.harry at gmail.com",
    password: "secret"
}
test('test basic strategy', (done) => {
    axios.post(`${URL}/auth/login`, user, {
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*",
        }
    }).then((response) => {
        expect(response).toBeDefined()
        done()
    }).catch((error) => {
        console.log(`Error from ${URL}: ${error}`)
        done()
        fail('connection refused')
    })
})
// http://localhost:3333/auth/register
test('test register', (done) => {
    axios.post(`${URL}/auth/register`, { email: "newUser@gmail.com", password: "password" }, {
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*",
        }
    }).then((response) => {
        expect(response).toBeDefined()
        expect(response.auth).toBeTrue()
        expect(response.token).toBeDefined()
        done()
    }).catch((error) => {
        console.log(`Error from ${URL}: ${error}`)
        done()
        fail('connection refused')
    })
})

