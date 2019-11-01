module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    'Post',
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    }
  );
  Post.associate = (db) => {
    // Post 테이블에 UserId 컬럼이 생성
    // hasMany - belongsTo가 연결됨, 1:N 구조
    db.Post.belongsTo(db.User);
    db.Post.hasMany(db.Comment);
    db.Post.hasMany(db.Image);
    // Post 테이블에 RetweetId 컬럼이 생성
    db.Post.belongsTo(db.Post, { as: 'Retweet' });
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
    db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' });
  };
  return Post;
};
