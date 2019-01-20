'use strict';

const util = require('util');
const express = require('express');
const authRouter = express.Router();

const User = require('./users-model.js');
const Role = require('./roles-model.js');

const auth = require('./middleware.js');
const oauth = require('./oauth/google.js');

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

// See commands.txt for JSON copy-paste to make the roles
// Collection is: roles
// This should be only a 1-time thing used by us to define the roles
authRouter.post('/roles', (req, res, next) => {
  let role = new Role(req.body);
  role.save(role)
    .then( (role) => {
      console.log(`Role added to db: ${role}`);
      res.status(200).send();
    })
    .catch(next);
});




module.exports = authRouter;
