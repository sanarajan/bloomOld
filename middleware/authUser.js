// middleware/isUserAuthenticated.js
function isUserAuthenticated(req, res, next) {
  console.log('Checking authentication');

    if (req.session && req.session.useremail&&req.session.userType===2) {
      // User is authenticated, proceed to the next middleware or route handler
      next();
    } else {
      // User is not authenticated, redirect to login page
      res.redirect('/');
    }
  }


  
  module.exports = isUserAuthenticated;
  