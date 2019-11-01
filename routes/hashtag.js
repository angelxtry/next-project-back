const express = require('express');
const { User, Post, Hashtag } = require('../models');

const router = express.Router();

router.get('/:tag', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: Hashtag,
          where: { name: decodeURIComponent(req.params.tag) }
        },
        { model: User, attributes: ['id', 'nickname'] },
        {
          model: Post,
          as: 'Retweet',
          include: [
            { model: User, attributes: ['id', 'nickname'] },
            { model: Image }
          ]
        }
      ]
    });
    res
      .status(200)
      .json({ code: 200, message: 'Hashtage search success.', data: posts });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
