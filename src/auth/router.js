'use strict';

/**
 * Auth router
 * Provides routes for managing users
 * @module src/auth/router
 */

const util = require('util');
const express = require('express');
const authRouter = express.Router();

const User = require('./users-model.js');
const Role = require('./roles-model.js');

const auth = require('./middleware.js');
const oauth = require('./oauth/google.js');

authRouter.post('/signup', handleSignup);
authRouter.post('/signin', auth(), handleSignin);
authRouter.get('/oauth', handleOAuth);
authRouter.post('/key', auth, handleKey);
authRouter.post('/roles', handleAddRoles);

/**
 * @function handleSignup
 * handles user signup
 * @param req {object} Express Request Object
 * @param res {object} Express Response Object
 * @param next {function} Express middleware next()
 */
function handleSignup(req, res, next){
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
};

/**
 * @function handleSignin
 * handles user signin
 * @param req {object} Express Request Object
 * @param res {object} Express Response Object
 * @param next {function} Express middleware next()
 */
function handleSignin(req, res, next) {
  res.cookie('auth', req.token);
  res.send(req.token);
};

/**
 * @function handleOAuth
 * handles user OAuth
 * @param req {object} Express Request Object
 * @param res {object} Express Response Object
 * @param next {function} Express middleware next()
 */
function handleOAuth(req,res,next) {
  oauth.authorize(req)
    .then( token => {
      res.status(200).send(token);
    })
    .catch(next);
};

/**
 * @function handleKey
 * handles user key generation
 * @param req {object} Express Request Object
 * @param res {object} Express Response Object
 * @param next {function} Express middleware next()
 */
function handleKey(req,res,next) {
  let key = req.user.generateKey();
  res.status(200).send(key);
};

// See commands.txt for JSON copy-paste to make the roles
// Collection is: roles
// This should be only a 1-time thing used by us to define the roles

/**
 * @function handleAddRoles
 * Used to create roles. Would normally require auth
 * @param req {object} Express Request Object
 * @param res {object} Express Response Object
 * @param next {function} Express middleware next()
 */
function handleAddRoles(req, res, next) {
  let role = new Role(req.body);
  role.save(role)
    .then( (role) => {
      console.log(`Role added to db: ${role}`);
      res.status(200).send();
    })
    .catch(next);
};


module.exports = authRouter;
