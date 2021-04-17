const axios = require('axios')
const PORT = 3333
const URL = `http://localhost:${PORT}/`
test('test server connection', (done) => {

    axios.get(`${URL}`).then((response) => {
        expect(response).toBeDefined()
        done()
    }).catch((error) => {
        console.log(`Error from ${URL}: ${error}`)
        fail('connection refused')
        done()
    })
})

