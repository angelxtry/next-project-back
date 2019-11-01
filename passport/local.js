const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const { User } = require('../models');

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'userId',
        passwordField: 'password'
      },
      async (userId, password, done) => {
        try {
          const user = await User.findOne({ where: { userId } });
          if (!user) {
            return done(null, false, { reason: 'User Info does not exist.' });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          }
          return done(null, false, { reason: 'Password is incorrect.' });
        } catch (e) {
          console.error(e);
          return done(e);
        }
      }
    )
  );
};
