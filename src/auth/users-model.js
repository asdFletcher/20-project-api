'use strict';

/** 
 *Class representing a user.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('./roles-model.js');

const SINGLE_USE_TOKENS = !!process.env.SINGLE_USE_TOKENS;
const TOKEN_EXPIRE = process.env.TOKEN_LIFETIME || '5m';
const SECRET = process.env.SECRET || 'foobar';

const usedTokens = new Set();

const users = new mongoose.Schema({
  username: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  email: {type: String},
  role: {type: String, default:'user', enum: ['admin','editor','user']},
}, { toObject:{virtuals:true}, toJSON:{virtuals:true} });

users.virtual('acl', {
  ref: 'roles',
  localField: 'role',
  foreignField: 'role',
  justOne:true,
});

users.pre('findOne', function() {
  try {
    this.populate('acl');
  }
  catch(e) {
    throw new Error(e.message);
  }
});

users.pre('save', function(next) {
  bcrypt.hash(this.password, 10)
    .then(hashedPassword => {
      this.password = hashedPassword;
      next();
    })
    .catch(error => {throw new Error(error);});
});

/**
 * Finds a user based on email, or creates a new user with default password if not found 
 * @param email {string} user email
 * @return user {object} the user object
 */
users.statics.createFromOauth = function(email) {

  if(! email) { return Promise.reject('Validation Error'); }

  return this.findOne( {email} )
    .then(user => {
      if( !user ) { throw new Error('User Not Found'); }
      return user;
    })
    .catch( error => {
      let username = email;
      let password = 'none';
      return this.create({username, password, email});
    });

};

/**
 * Determines whether the user token is valid
 * @param token {string} user token
 * @return error message {string} if token is invalid
 * @return user {object} the user object if token is valid
 */
users.statics.authenticateToken = function(token) {
  
  if ( usedTokens.has(token ) ) {
    return Promise.reject('Invalid Token');
  }
  
  try {
    let parsedToken = jwt.verify(token, SECRET);
    (SINGLE_USE_TOKENS) && parsedToken.type !== 'key' && usedTokens.add(token);
    let query = {_id: parsedToken.id};
    return this.findOne(query);
  } catch(e) { throw new Error('Invalid Token'); }
  
};

/**
 * Determines whether the user auth is valid
 * @param auth {object} object with username and password
 * @return error message {string} if invalid
 * @return user {object} if authentication is valid
 */
users.statics.authenticateBasic = function(auth) {
  let query = {username:auth.username};
  return this.findOne(query)
    .then( user => user && user.comparePassword(auth.password) )
    .catch(error => {throw error;});
};

/**
 * @Users.methods.comparePassword
 * Compares the input password to the stored user password
 * @param password {string} password string
 * @return valid {boolean} true or false
 */
users.methods.comparePassword = function(password) {
  return bcrypt.compare( password, this.password )
    .then( valid => valid ? this : null);
};

/**
 * Generates a token for the specific user
 * @param type {string} user type: user, editor, admin, etc...
 * @return token {string} encoded javascript web token containing user data
 */
users.methods.generateToken = function(type) {
  
  let token = {
    id: this._id,
    capabilities: this.acl.capabilities,
    type: type || 'user',
  };
  
  let options = {};
  if ( type !== 'key' && !! TOKEN_EXPIRE ) { 
    options = { expiresIn: TOKEN_EXPIRE };
  }
  
  return jwt.sign(token, SECRET, options);
};

/**
 * Determines whether a user has a given capability
 * @param capability {string} The capability we're checking the user for
 * @return true/false {boolean} whether the user has that capability or not
 */
users.methods.can = function(capability) {
  return this.acl.capabilities.includes(capability);
};

users.methods.generateKey = function() {
  return this.generateToken('key');
};

module.exports = mongoose.model('users', users);
