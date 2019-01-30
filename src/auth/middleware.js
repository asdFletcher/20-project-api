'use strict';

const User = require('./users-model.js');
/**
 * Auth Middleware
 * @module auth/middleware
 */

/**
 * Determines how a user is trying to authenticate and authenticates them accordingly
 * @param capability {string} String representing capability
 * @param req {object} Express Request Object
 * @param res {object} Express Response Object
 * @param next {function} Express middleware next()
 */
module.exports = (capability) => {
  return (req, res, next) => {
    try {
      let [authType, authString] = req.headers.authorization.split(/\s+/);
      switch (authType.toLowerCase()) {
        case 'basic':
          return _authBasic(authString);
        case 'bearer':
          return _authBearer(authString);
        default:
          return _authError();
      }
    } catch (e) {
      _authError();
    }

/**
 * Handles authentication when a user is using basic auth
 * @function _authBasic
 * @param str {string} string representing the base64 auth string, from the request header
 * @returns user {object} if authenticated, or false if not
 */
    function _authBasic(str) {
      // str: am9objpqb2hubnk=
      let base64Buffer = Buffer.from(str, 'base64'); // <Buffer 01 02 ...>
      let bufferString = base64Buffer.toString();    // john:mysecret
      let [username, password] = bufferString.split(':'); // john='john'; mysecret='mysecret']
      let auth = {username, password}; // { username:'john', password:'mysecret' }

      return User.authenticateBasic(auth)
        .then(user => _authenticate(user))
        .catch(_authError);
    }

/**
 * Handles authentication when a user is using bearer auth
 * @function _authBearer
 * @param str {string} string representing the auth token, from the request header
 * @returns user {object} if authenticated, or false if not
 */
    function _authBearer(authString) {
      return User.authenticateToken(authString)
        .then(user => _authenticate(user))
        .catch(_authError);
    }

/**
 * Given a user determines whether they have authenticated and are authorized. If so, the user and a token is added to the request
 * @function _authenticate
 * @param user {object} string representing the user
 */
    function _authenticate(user) {
      if ( user && (!capability || (user.can(capability))) ) {
        req.user = user;
        req.token = user.generateToken();
        next();
      }
      else {
        _authError();
      }
    }

/**
 * Calls next with an error message
 * @function _authError
 */
    function _authError() {
      next('Invalid User ID/Password');
    }

  };
  
};