const { readFileSync, writeFileSync } = require('fs');

module.exports = class Cache {
  static cacheAccessToken({ accessToken, ttlSeconds }) {
    const validTill = Date.now() + (ttlSeconds * 1000);

    writeFileSync(
      'data/access_token.json',
      JSON.stringify({ accessToken, validTill }),
    );
  }


  static getCachedTokenIfValid() {
    try {
      const data = readFileSync('data/access_token.json');
      const { accessToken, validTill } = JSON.parse(data.toString());

      if (Date.now() < validTill) {
        return accessToken;
      }
    } catch (e) {
      console.log(e);
    }

    return null;
  }


  static cacheCoinList(coins) {
    const validTill = Date.now() + (7 * 24 * 60 * 60 * 1000);
    writeFileSync('data/coins.json', JSON.stringify({ validTill, coins }));
  }

  static getCachedCoinList() {
    try {
      const data = readFileSync('data/coins.json');
      const { validTill, coins } = JSON.parse(data.toString());

      if (Date.now() < validTill) {
        return coins;
      }
    } catch (e) {
      console.log(e);
    }

    return null;
  }


  static cacheCategoryList(categories) {
    const validTill = Date.now() + (7 * 24 * 60 * 60 * 1000);
    writeFileSync('data/categories.json', JSON.stringify({ validTill, categories }));
  }

  static getCachedCategoryList() {
    try {
      const data = readFileSync('data/categories.json');
      const { validTill, categories } = JSON.parse(data.toString());

      if (Date.now() < validTill) {
        return categories;
      }
    } catch (e) {
      console.log(e);
    }

    return null;
  }
};
