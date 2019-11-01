const express = require('express');
const multer = require('multer');
const path = require('path');

const { User, Post, Hashtag, Comment, Image } = require('../models');
const { isLoggedIn } = require('./middleware');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, 'uploads');
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext); // 제로초.png, ext===.png, basename===제로초
      done(null, basename + new Date().valueOf() + ext);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.post('/images', upload.array('image'), (req, res) => {
  console.log(req.files);
  res.status(200).json({
    code: 200,
    message: 'Image upload success',
    data: req.files.map((v) => v.filename)
  });
});

// POST /api/post
router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
  try {
    const hashtags = req.body.content.match(/#[^\s]+/g);
    const newPost = await Post.create({
      content: req.body.content,
      UserId: req.user.id
    });

    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) =>
          Hashtag.findOrCreate({
            where: { name: tag.slice(1).toLowerCase() }
          })
        )
      );
      console.log('Hashtags: ', result);
      await newPost.addHashtags(result.map((r) => r[0]));
    }

    if (req.body.image) {
      // 이미지 주소를 여러개 올리면 image: [주소1, 주소2]
      if (Array.isArray(req.body.image)) {
        const images = await Promise.all(
          req.body.image.map((image) => {
            return Image.create({ src: image });
          })
        );
        await newPost.addImages(images);
      } else {
        // 이미지를 하나만 올리면 image: 주소1
        const image = await Image.create({ src: req.body.image });
        await newPost.addImage(image);
      }
    }

    const postInfo = await Post.findOne({
      where: { id: newPost.id },
      include: [
        { model: User, attributs: ['id', 'nickname'] },
        { model: Image },
        { model: User, through: 'Like', as: 'Likers', attributes: ['id'] }
      ]
    });

    return res
      .status(200)
      .json({ code: 200, message: 'Post saved.', data: postInfo });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ code: 400, message: 'Post not found.' });
    }
    const comments = await Comment.findAll({
      where: { PostId: req.params.id },
      order: [['createdAt', 'ASC']],
      include: [{ model: User, attributes: ['id', 'nickname'] }]
    });
    return res
      .status(200)
      .json({ code: 200, message: 'Comments select success.', data: comments });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/:id/comment', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ code: 404, message: 'Post not found.' });
    }
    const newComment = await Comment.create({
      PostId: post.id,
      UserId: req.user.id,
      content: req.body.content
    });
    await post.addComment(newComment.id);
    const comment = await Comment.findOne({
      where: { id: newComment.id },
      include: [{ model: User, attributes: ['id', 'nickname'] }]
    });
    return res
      .status(200)
      .json({ code: 200, message: 'Comment write.', data: comment });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/:id/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ code: 400, message: 'Post not found.' });
    }
    await post.addLiker(req.user.id);
    res.status(200).json({
      code: 200,
      message: 'Like seccess.',
      userId: req.user.id
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:id/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ code: 400, message: 'Post not found.' });
    }
    await post.removeLiker(req.user.id);
    res.status(200).json({
      code: 200,
      message: 'Unlike seccess.',
      userId: req.user.id
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/:id/retweet', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id },
      include: [{ model: Post, as: 'Retweet' }]
    });
    if (!post) {
      return res.status(404).json({ code: 404, message: 'Post not found.' });
    }
    if (
      req.user.id === post.UserId ||
      (post.Retweet && post.Retweet.UserId === req.user.id)
    ) {
      return res
        .status(403)
        .json({ code: 403, message: 'Your post cannot be retweeted.' });
    }
    const retweetTargetId = post.RetweetId || post.id;
    const exPost = await Post.findOne({
      where: {
        UserId: req.user.id,
        RetweetId: retweetTargetId
      }
    });
    if (exPost) {
      return res.status(403).json({ code: 403, message: 'Already retweeted.' });
    }
    const retweet = await Post.create({
      UserId: req.user.id,
      RetweetId: retweetTargetId,
      content: 'retweet'
    });
    const retweetWithPrevPost = await Post.findOne({
      where: { id: retweet.id },
      include: [
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
    res.status(200).json({
      code: 200,
      message: 'Retweet success.',
      data: retweetWithPrevPost
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
