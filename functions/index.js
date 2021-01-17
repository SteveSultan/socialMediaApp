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
firebase.initializeApp(firebaseConfig);

//retrieving screams route
app.get('/screams', (req, res) => {
    admin  
        .firestore()
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

//create new scream route
app.post('/scream', (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };
    
    admin.firestore()
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

//Sign up route

app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data=> {
        return res.status(201).json({ message: `user ${data.user.uid} signed up successfully`});
    })
    .catch(err =>{
        console.error(err);
        return res.status(500).json({ error: err.code })
    })
})


exports.api = functions.https.onRequest(app);