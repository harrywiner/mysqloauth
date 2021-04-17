var express = require("express");

var cors = require('cors');
var cookieParser = require('cookie-parser');
var dotenv = require('dotenv');
dotenv.config();
var session = require('express-session');

var app = express();

const {
  VerifyToken, router, PassportConfig, EnsureAuthenticated,
  ForwardAuthenticated, AssignToken } = require('./src/auth')
const api = require('./src/api')

app.use('/api', api)
app.use('/auth', router)



corsOptions = {
  origin: "*"
}

app.use(cors(corsOptions))
const port = process.env.PORT || 3333;
app.use('/public', express.static(__dirname + "/public")).use(cookieParser());
app.use('/styles', express.static(__dirname + '/public/css'))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// initialize session and link to passport

const passport = require('passport')
PassportConfig(passport)

var session = require('express-session')
app.use(
  session({
    secret: 'Butar and Butar',
    resave: true,
    saveUninitialized: true
  }));

app.use(passport.initialize());
app.use(passport.session());

// ROUTES

app.get('/', (req, res) => {
  res.redirect('/login')
})

app.get('/dashboard', EnsureAuthenticated, (req, res) => {
  res.send(`User ID: ${req.session.passport.user}
  Token:
  ${req.session.token}`)
})

app.post('/helloWorld', VerifyToken, (req, res) => {
  res.send({ message: "Hello " + req.query.name })
})

// AUTH

app.get('/callback', EnsureAuthenticated, AssignToken, (req, res) => {
  res.redirect('/dashboard')
})

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html')
})

app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/callback',
    failureRedirect: '/login?error'
  })(req, res, next)
})

app.get('/logout', (req, res, next) => {
  req.logout()
  // invalidate token
  res.redirect('/login')
})

app.listen(port, () => console.log("Server listening on " + port));