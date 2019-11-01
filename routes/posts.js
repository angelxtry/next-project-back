const express = require('express');
const { User, Post, Image } = require('../models');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [
        { model: User, attributes: ['id', 'nickname'] },
        { model: Image },
        { model: User, through: 'Like', as: 'Likers', attributes: ['id']},
        {
          model: Post,
          as: 'Retweet',
          include: [
            { model: User, attributes: ['id', 'nickname'] },
            { model: Image }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res
      .status(200)
      .json({ code: 200, message: 'select success.', data: posts });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;
