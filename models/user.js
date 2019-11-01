module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      nickname: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      userId: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    },
    {
      charset: 'utf8',
      collate: 'utf8_general_ci'
    }
  );

  User.associate = (db) => {
    // 유저는 포스트를 여러개 가질 수 있다.
    db.User.hasMany(db.Post, { as: 'Posts' });
    // 유저는 코멘트를 여러개 가질 수 있다.
    db.User.hasMany(db.Comment);
    // N:M 관계, Like라는 테이블이 생성됨.
    db.User.belongsToMany(db.Post, { through: 'Like', as: 'Liked' });
    // N:M 관계, Follow라는 테이블이 생성됨.
    db.User.belongsToMany(db.User, {
      through: 'Follow',
      as: 'Followers',
      foreignKey: 'followingId'
    });
    // N:M 관계, Follow라는 테이블이 생성됨.
    db.User.belongsToMany(db.User, {
      through: 'Follow',
      as: 'Followings',
      foreignKey: 'followerId'
    });
  };

  return User;
};

// 사용자 정보를 가져올 때 사용자 입장에서 정보를 가져오게 되면 다음과 같이 된다.
// as가 여기서 사용되기 때문에 매우 중요하다.

// const user = {
//   userId: 1,
//   nickname: 'angelx',
//   Liked: [{}, {}],
//   Followers: [{}, {}],
//   Followings: [{}, {}],
// }
