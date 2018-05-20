#!/usr/bin/env node

const axios = require('axios');
const { readFileSync, writeFileSync } = require('fs');

module.exports = class CoinMarketCalendarClient {
  constructor({ clientId, clientSecret }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
  }


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


  async authenticate() {
    const cachedAccessToken = CoinMarketCalendarClient.getCachedTokenIfValid();
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

        CoinMarketCalendarClient.cacheAccessToken({
          accessToken: this.accessToken,
          ttlSeconds: authResponse.data.expires_in,
        });
      }
    } catch (e) {
      console.log(e);
    }
  }


  async getCoins() {
    const coinsUrl = 'https://api.coinmarketcal.com/v1/coins';

    if (this.accessToken == null) {
      await this.authenticate();
    }

    try {
      const coinsResponse = await axios(coinsUrl, {
        params: {
          access_token: this.accessToken,
        },
      });

      if (coinsResponse.data) {
        return coinsResponse.data;
      }
    } catch (e) {
      // TODO: Catch auth faiure and unset this.access_token
      console.log(e);
    }

    return null;
  }


  async getCategories() {
    const categoriesUrl = 'https://api.coinmarketcal.com/v1/categories';

    if (this.accessToken == null) {
      await this.authenticate();
    }

    try {
      const categoriesResponse = await axios(categoriesUrl, {
        params: {
          access_token: this.accessToken,
        },
      });

      if (categoriesResponse.data) {
        return categoriesResponse.data;
      }
    } catch (e) {
      // TODO: Catch auth faiure and unset this.access_token
      console.log(e);
    }

    return null;
  }


  async getEvents({ page = 1, max = 50, coins }) {
    const eventsUrl = 'https://api.coinmarketcal.com/v1/events';

    if (this.accessToken == null) {
      await this.authenticate();
    }

    const params = { access_token: this.accessToken, page, max };

    if (coins) {
      params.coins = coins;
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
