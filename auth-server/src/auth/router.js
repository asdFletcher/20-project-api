'use strict';

const express = require('express');
const authRouter = express.Router();

const User = require('./users-model.js');
const Role = require('./roles-model.js');

const auth = require('./middleware.js');
const oauth = require('./oauth/google.js');

// router.get('/public-stuff', (req, res, next) ={

// });
// router.get('/hidden-stuff', auth(), (req, res, next) ={

// });
// router.get('/something-to-read', auth('read'), (req, res, next) ={

// });
// router.post('/create-a-thing', auth('create'), (req, res, next) ={

// });
// router.put('/update', auth('update'), (req, res, next) ={

// });
// router.delete('/bye-bye', auth('delete'), (req, res, next) ={

// });
// router.get('/everything', auth('superuser'), (req, res, next) ={

// });

authRouter.post('/signup', (req, res, next) => {
  let user = new User(req.body);
  user.save()
    .then( (user) => {
      User.findOne({_id: user._id})
        .then(user => {
          req.token = user.generateToken();
          req.user = user;
          res.set('token', req.token);
          res.cookie('auth', req.token);
          res.send(req.token);
        });
    })
    .catch(next);
});

authRouter.post('/signin', auth(), (req, res, next) => {
  res.cookie('auth', req.token);
  res.send(req.token);
});

authRouter.get('/oauth', (req,res,next) => {
  oauth.authorize(req)
    .then( token => {
      res.status(200).send(token);
    })
    .catch(next);
});

authRouter.post('/key', auth, (req,res,next) => {
  let key = req.user.generateKey();
  res.status(200).send(key);
});


authRouter.post('/config', (req, res, next) => {
  let role = new Role(req.body);
  role.save(role)
    .then( (role) => {
      console.log(role);
      // User.findOne({_id: user._id})
      //   .then(user => {
      //     req.token = user.generateToken();
      //     req.user = user;
      //     res.set('token', req.token);
      //     res.cookie('auth', req.token);
      //     res.send(req.token);
      //   });
    })
    .catch(next);
});




module.exports = authRouter;
