module.exports = (sequelize, DataTypes) => {
  const Hashtag = sequelize.define(
    'Hashtag',
    {
      name: {
        type: DataTypes.STRING(20),
        allowNull: false
      }
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    }
  );
  Hashtag.associate = (db) => {
    // N:M 관계 PostHashtag라는 테이블이 자동으로 생성된다.
    db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag' });
  };
  return Hashtag;
};
