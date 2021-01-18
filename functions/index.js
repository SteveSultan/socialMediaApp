/**
 * Steve Sultan
 * 
 */
const functions = require("firebase-functions");

const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login } = require('./handlers/users');

// Initialize Firebase
const firebase = require('firebase');
const { json } = require("express");
const e = require("express");


//screams route
app.get('/screams', getAllScreams)
//post a new scream route
app.post('/scream', FBAuth, postOneScream);
//Sign up route
app.post('/signup', signup);
//login route
app.post('/login', login);
//upload image route
app.post('/user/image', uploadImage);


exports.api = functions.https.onRequest(app);