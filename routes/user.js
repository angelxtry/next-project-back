const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const { User, Post, Image } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middleware');

const router = express.Router();

router.get('/', isLoggedIn, (req, res) => {
  return res
    .status(200)
    .json({ code: 200, message: 'Login success', data: req.user });
});

router.post('/', isNotLoggedIn, async (req, res, next) => {
  const { userId, nickname, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { userId } });
    if (exUser) {
      return res.status(403).json({ code: 403, message: 'Already exist.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      userId,
      nickname,
      password: passwordHash
    });
    return res
      .status(200)
      .json({ code: 200, message: 'User create.', data: newUser });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) {
      console(error);
      return next(error);
    }
    if (info) {
      return res.status(401).json({ code: 401, message: info.reason });
    }
    return req.login(user, async (loginError) => {
      if (loginError) {
        return next(loginError);
      }
      const userInfo = await User.findOne({
        where: { id: user.id },
        include: [
          { model: Post, as: 'Posts', attributes: ['id'] },
          { model: User, as: 'Followings', attributes: ['id'] },
          { model: User, as: 'Followers', attributes: ['id'] }
        ],
        attributes: ['id', 'nickname', 'userId']
      });
      console.log('Login success: ', req.user);
      return res
        .status(200)
        .json({ code: 200, message: 'Login success', data: userInfo });
    });
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.status(200).json({ code: 200, message: 'Logout success' });
});

router.get('/:id/posts', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      where: { UserId: parseInt(req.params.id, 10), RetweetId: null },
      include: [
        { model: User, attributes: ['id', 'nickname'] },
        { model: Image },
        { model: User, through: 'Like', as: 'Likers', attributes: ['id'] }
      ]
    });
    return res.status(200).json({
      code: 200,
      message: 'Posts select(UserId) success.',
      data: posts
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: parseInt(req.params.id, 10) },
      include: [
        { model: Post, as: 'Posts', attributes: ['id'] },
        { model: User, as: 'Followings', attributes: ['id'] },
        { model: User, as: 'Followers', attributes: ['id'] }
      ],
      attributes: ['id', 'nickname', 'userId']
    });
    const jsonUser = user.toJSON();
    jsonUser.Posts = jsonUser.Posts ? jsonUser.Posts.length : 0;
    jsonUser.Followings = jsonUser.Followings ? jsonUser.Followings.length : 0;
    jsonUser.Followers = jsonUser.Followers ? jsonUser.Followers.length : 0;
    return res.status(200).json({
      code: 200,
      message: 'User select(UserId) success.',
      data: jsonUser
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    const me = await User.findOne({
      where: { id: req.user.id }
    });
    await me.addFollowing(req.params.id);
    res.send(req.params.id);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.delete('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    const me = await User.findOne({
      where: { id: req.user.id }
    });
    await me.removeFollowing(req.params.id);
    res.send(req.params.id);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.get('/:id/followings', isLoggedIn, async (req, res, next) => {
  // /api/user/:id/followings
  try {
    const user = await User.findOne({
      where: { id: parseInt(req.params.id, 10) }
    });
    const followers = await user.getFollowings({
      attributes: ['id', 'nickname']
    });
    res.json(followers);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.get('/:id/followers', isLoggedIn, async (req, res, next) => {
  // /api/user/:id/followers
  try {
    const user = await User.findOne({
      where: { id: parseInt(req.params.id, 10) }
    });
    const followers = await user.getFollowers({
      attributes: ['id', 'nickname']
    });
    res.json(followers);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.delete('/:id/follower', isLoggedIn, async (req, res, next) => {
  try {
    const me = await User.findOne({
      where: { id: req.user.id }
    });
    await me.removeFollower(req.params.id);
    res.send(req.params.id);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.patch('/nickname', isLoggedIn, async (req, res, next) => {
  try {
    await User.update(
      { nickname: req.body.nickname },
      { where: { id: req.user.id } }
    );
    res.send(req.body.nickname);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

module.exports = router;
