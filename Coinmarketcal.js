#!/usr/bin/env node

const axios = require('axios');
const Cache = require('./Cache');
const { isNonEmptyArray } = require('./utils');

const WEEK_IN_MS = (7 * 24 * 60 * 60 * 1000);

module.exports = class CoinMarketCalendarClient {
  constructor({ apiKey }) {
    this.cache = new Cache();

    this.defaultHeaders = {
      'x-api-key': apiKey,
      'Accept-Encoding': 'deflate, gzip',
      Accept: 'application/json',
    };
  }

  handleAPIError(e) {
    if (e.response && e.response.status === 403) {
      console.log('Authentication failed. Invalid API Key.');
    } else if (e.response && e.response.status === 429) {
      console.log('API usage quota exceeded');
    } else if (e.code === 'ENOTFOUND') {
      console.log('Unable to connect to server. Check your internet connection');
    } else {
      console.log(e);
    }
  }

  async getCoins() {
    // If cache has non-empty coin list, return that.
    const cachedCoinList = this.cache.get('coins');
    if (isNonEmptyArray(cachedCoinList)) {
      return cachedCoinList;
    }

    const coinsUrl = 'https://developers.coinmarketcal.com/v1/coins';

    try {
      const response = await axios(coinsUrl, { headers: this.defaultHeaders });

      if (response.data == null || response.data.body == null) {
        throw Error('Invalid response, Response did not contain body key');
      }

      const coins = response.data.body;

      if (isNonEmptyArray(coins)) {
        this.cache.set('coins', coins, WEEK_IN_MS);
        return coins;
      }
    } catch (e) {
      this.handleAPIError(e);
    }

    return null;
  }


  async getCategories() {
    // If cache has non-empty category list, return that.
    const cachedCategoryList = this.cache.get('categories');
    if (isNonEmptyArray(cachedCategoryList)) {
      return cachedCategoryList;
    }

    const categoriesUrl = 'https://developers.coinmarketcal.com/v1/categories';

    try {
      const response = await axios(categoriesUrl, { headers: this.defaultHeaders });

      if (response.data == null || response.data.body == null) {
        throw Error('Invalid response, Response did not contain body key');
      }

      const categories = response.data.body;

      if (isNonEmptyArray(categories)) {
        this.cache.set('categories', categories, WEEK_IN_MS);
        return categories;
      }
    } catch (e) {
      this.handleAPIError(e);
    }

    return null;
  }


  async getEvents({
    page = 1, max = 150, coins, categories,
  }) {
    const eventsUrl = 'https://developers.coinmarketcal.com/v1/events';

    const params = { page, max };

    if (isNonEmptyArray(coins)) {
      params.coins = coins.join(',');
    }

    if (isNonEmptyArray(categories)) {
      params.categories = categories.join(',');
    }

    try {
      const eventsResponse = await axios(eventsUrl, { params, headers: this.defaultHeaders });

      if (eventsResponse.data == null) {
        throw Error('Invalid response, Response did not contain body key');
      }

      return eventsResponse.data.body || [];
    } catch (e) {
      this.handleAPIError(e);
    }

    return null;
  }
};
