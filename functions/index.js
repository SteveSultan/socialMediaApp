/**
 * Steve Sultan
 * SteveSultan@outlook.com
 */
const functions = require("firebase-functions");
const admin = require('firebase-admin');
const app = require('express')();
admin.initializeApp();

const firebaseConfig = {
    //web app's Firebase configuration
    apiKey: "AIzaSyCgUSz1QuqbDzKcymhGDBq6uhYHQawaaGc",
    authDomain: "socialapp-6b126.firebaseapp.com",
    projectId: "socialapp-6b126",
    storageBucket: "socialapp-6b126.appspot.com",
    messagingSenderId: "764080498607",
    appId: "1:764080498607:web:2d3229ad2dba32ee13b15a",
    measurementId: "G-SFT31XFB2Y"
};

// Initialize Firebase
const firebase = require('firebase');
const { json } = require("express");
const e = require("express");
firebase.initializeApp(firebaseConfig);

const db= admin.firestore();

//retrieving screams route
app.get('/screams', (req, res) => {
    db 
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
        let screams = [];
        data.forEach(doc =>{
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        } );
        return res.json(screams);
    })
    .catch(err => console.error(err));
})

//authentication middleware
const FBAuth = (req, res, next) => {
    let idToken  //id token var.
    if (req.headers.authorization && req.headers.authorization.startWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('No token found')
        return res.status(403).json({ error: 'Unauthorized'})
    }

    //To verify that, if this token issue by our application
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            console.log(decodedToken);
    //do database request to get user collection from firebase
            return db.collection('users')
            .where('userId', '==', req.user.uid) 
            .limit(1) //limit result to one document
            .get();
        })
        .then(data => {
            req.user.handle = data.docs[0].data().handle; //take the first element from doc handle
            return next();
        })
        .catch(err => {
            console.error('Error while verifying token', err);
            return res.status(403).json(err);
        })
}

//post a new scream route
app.post('/scream', FBAuth, (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };
    
    db
        .collection('screams')
        .add(newScream)
        .then(doc => {
            res.json({ message: `document ${doc.id} created successfully`});
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong' });
            console.error(err)
        });
});

const isEmial = (email) => {
    //Email Address Regular Expression for JS
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if(email.match(regEx)) return true;
    else return false;
} 

const isEmpty = (string) => {
    if (string.trim() == '') return true;
    else return false;    
}

//Sign up route

app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    let errors = {}; 
    if(isEmpty(newUser.email))
    {
        errors.email = 'Must not be empty'
    } else if(!isEmial(newUser.email)){
        errors.email = 'Must be a valid email address'
    }

    if(isEmpty(newUser.password)) errors.password = 'Must not empty'
    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Password must be same'
    if(isEmpty(newUser.handle)) errors.handle = 'Must not empty'

    if(Object.keys(errors).length > 0) return res.status(400).json(errors)
    
    //validate the data
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc=>{
            if(doc.exists){
                return res.status(400),json({ handle: `this handle is already taken`})
            }else{
            return firebase
                .auth()
                .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data =>{
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use'){
                return res.status(400).json({ email: 'Email is already is use'})
            }else{
                return res.status(500).json({error: err.code });
            }
        });
});

//login route
app.post('/login',(req,res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    let errors = {};

    if(isEmpty(user.email)) errors.email = 'Must not be empty';
    if (isEmpty(user.password)) errors.password = 'Must not be empty';

    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

    firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      // auth/wrong-password
      // auth/user-not-user
      return res
        .status(403)
        .json({ general: "Wrong credentials, please try again" });
    });
});

exports.api = functions.https.onRequest(app);