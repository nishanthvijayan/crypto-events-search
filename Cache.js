const { readFileSync, writeFileSync } = require('fs');

const MONTH_IN_MS = (7 * 24 * 60 * 60 * 1000);

module.exports = class Cache {
  static cacheAccessToken({ accessToken, ttlSeconds }) {
    const validTill = Date.now() + (ttlSeconds * 1000);

    writeFileSync(
      __dirname + '/data/access_token.json',
      JSON.stringify({ accessToken, validTill }),
    );
  }


  static getCachedTokenIfValid() {
    try {
      const data = readFileSync(__dirname + '/data/access_token.json');
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
    const validTill = Date.now() + MONTH_IN_MS;
    writeFileSync(__dirname + '/data/coins.json', JSON.stringify({ validTill, coins }));
  }

  static getCachedCoinList() {
    try {
      const data = readFileSync(__dirname + '/data/coins.json');
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
    const validTill = Date.now() + MONTH_IN_MS;
    writeFileSync(__dirname + '/data/categories.json', JSON.stringify({ validTill, categories }));
  }

  static getCachedCategoryList() {
    try {
      const data = readFileSync(__dirname + '/data/categories.json');
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
