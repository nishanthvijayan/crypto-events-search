#!/usr/bin/env node

const axios = require('axios');
const Cache = require('./Cache');

module.exports = class CoinMarketCalendarClient {
  constructor({ clientId, clientSecret }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
  }


  async authenticate() {
    const cachedAccessToken = Cache.getCachedTokenIfValid();
    if (cachedAccessToken) {
      this.accessToken = cachedAccessToken;
      return;
    }

    const authUrl = 'https://api.coinmarketcal.com/oauth/v2/token';

    try {
      const authResponse = await axios(authUrl, {
        params: {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
      });

      if (authResponse.data && authResponse.data.access_token) {
        this.accessToken = authResponse.data.access_token;

        Cache.cacheAccessToken({
          accessToken: this.accessToken,
          ttlSeconds: authResponse.data.expires_in,
        });
      }
    } catch (e) {
      console.log(e);
    }
  }


  async getCoins() {
    // If cache has fresh,non-empty coin list, return that.
    const cachedCoinList = Cache.getCachedCoinList();
    if (cachedCoinList && Array.isArray(cachedCoinList) && cachedCoinList.length > 0) {
      return cachedCoinList;
    }


    const coinsUrl = 'https://api.coinmarketcal.com/v1/coins';

    if (this.accessToken == null) {
      await this.authenticate();
    }

    try {
      const coins = await axios(coinsUrl, {
        params: {
          access_token: this.accessToken,
        },
      }).data;

      if (coins && Array.isArray(coins) && coins.length > 0) {
        Cache.cacheCoinList(coins);
        return coins;
      }
    } catch (e) {
      // TODO: Catch auth faiure and unset this.access_token
      console.log(e);
    }

    return null;
  }


  async getCategories() {
    // If cache has fresh,non-empty category list, return that.
    const cachedCategoryList = Cache.getCachedCategoryList();
    if (cachedCategoryList && Array.isArray(cachedCategoryList) && cachedCategoryList.length > 0) {
      return cachedCategoryList;
    }

    const categoriesUrl = 'https://api.coinmarketcal.com/v1/categories';

    if (this.accessToken == null) {
      await this.authenticate();
    }

    try {
      const categories = await axios(categoriesUrl, {
        params: {
          access_token: this.accessToken,
        },
      }).data;

      if (categories && Array.isArray(categories) && categories.length > 0) {
        Cache.cacheCategoryList(categories);
        return categories;
      }
    } catch (e) {
      // TODO: Catch auth faiure and unset this.access_token
      console.log(e);
    }

    return null;
  }


  async getEvents({
    page = 1, max = 150, coins, categories,
  }) {
    const eventsUrl = 'https://api.coinmarketcal.com/v1/events';

    if (this.accessToken == null) {
      await this.authenticate();
    }

    const params = { access_token: this.accessToken, page, max };

    if (coins) {
      params.coins = coins.join(',');
    }

    if (categories) {
      params.categories = categories.join(',');
    }

    try {
      const eventsResponse = await axios(eventsUrl, { params });

      if (eventsResponse.data) {
        return eventsResponse.data;
      }
    } catch (e) {
      // TODO: Catch auth faiure and unset this.access_token
      console.log(e);
    }

    return null;
  }
};
