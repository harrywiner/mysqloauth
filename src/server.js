var tools = require("./tools");
var yargs = require("yargs");
var express = require("express");
var request = require("request");
const mysql = require("mysql");

var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var dotenv = require('dotenv');
dotenv.config();
var session = require('express-session');

const port = process.env.PORT || 3333;

var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = process.env.REDIRECT_URI; // Your redirect uri

var stateKey = '';


// https://vast-castle-09510.herokuapp.com/
// https://git.heroku.com/vast-castle-09510.git

var app = express();

app.use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());


app.listen(port, () => console.log("Listening on " + port));

var secret = tools.generateRandomString(16);

var sess = {
  secret: secret,
  cookie: {},
  resave: false,
  saveUninitialized: true
};

if (app.get('env') === 'production') {
  sess.cookie.secure = true;
}
app.use(session(sess));

const { VerifyToken, router, setup } = require('./crypt')
setup({ options })
app.use('/auth', router)


// API

app.get('/', (req, res) => {
  res.send("Hello World!")
})

app.post('/helloWorld', (req, res) => {
  res.send({ message: "Hello " + req.query.name })
})

// START OF AUTH

app.get('/login', function (req, res) {

  var state = tools.generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-currently-playing user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    // TODO
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          // TODO
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          //console.log(body);
        });

        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});


