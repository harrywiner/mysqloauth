A skeleton program for figuring out OAuth

sample GraphQL query:
``` GraphQL
query getUserByEmail($email: String!) {
    getUser(email: $email) {
        email
        pwd
        type
    }
}
```
inputs:
``` GraphQL
{
  "email": "winer.harry@gmail.com"
}
```

"Cannot query field \"getPrivelage\" on type \"Query\"."
make sure buildSchema queries match the rootValue names

All fields null
get an index of the result of `filter` 

sample hashing and comparing
``` js
bcrypt.hash(plaintextpwd, saltRounds, function (err, hash) {
        // Store hash in your password DB.
        console.log(hash)
        bcrypt.compare(plaintextpwd, hash, function (err, result) {
            // result == true
            if (result)
                console.log("positive works!")
        });
        bcrypt.compare(otherpwd, hash, function (err, result) {
            // result == false
            if (!result)
                console.log("negative works!")
        });
    });
```

sample graphql query
``` javascript
function getQL() {
    email = "winer.harry at gmail.com"
    query = `
    query getUserByEmail($email: String!) {
      getUser(email: $email) {
          email
          pwd
          type
      }
    }`
    request.post('http://localhost:3333/graphql',
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables: { email } })
        }, (error, response, body) => {
            console.log("data returned" + body)

        })
}

getQL()

```