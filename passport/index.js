const passport = require('passport');
const { User, Post } = require('../models');
const local = require('./local');

module.exports = () => {
  passport.serializeUser((user, done) => {
    return done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({
        where: { id },
        include: [
          { model: Post, as: 'Posts', attributes: ['id'] },
          { model: User, as: 'Followings', attributes: ['id'] },
          { model: User, as: 'Followers', attributes: ['id'] }
        ],
        attributes: ['id', 'nickname', 'userId']
      });
      return done(null, user);
    } catch (error) {
      console.error(error);
      return done(error);
    }
  });

  local();
};
