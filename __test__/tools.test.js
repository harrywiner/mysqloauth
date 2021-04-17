const tools = require('../src/tools')

var sampleUser;

test('test getUser', (done) => {
    tools.getUser('winer.harry at gmail.com').then(({ err, user }) => {
        expect(err).toBeNull()
        expect(user.email).toEqual("winer.harry at gmail.com")
        expect(user).toHaveProperty('password')
        expect(user).toHaveProperty('id')
        sampleUser = user
        done()
    })
})

test('test getUserByID', (done) => {
    expect(sampleUser).toBeDefined()
    tools.getUserByID(sampleUser.id).then(({ err, user }) => {
        expect(err).toBeNull()
        expect(user.email).toEqual("winer.harry at gmail.com")
        expect(user).toHaveProperty('password')
        expect(user).toHaveProperty('id')
        done()
    })
})
