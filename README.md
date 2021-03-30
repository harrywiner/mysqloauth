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