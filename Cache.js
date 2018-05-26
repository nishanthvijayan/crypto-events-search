const Configstore = require('configstore');
const pkg = require('./package.json');


module.exports = class Cache {
  constructor() {
    this.store = new Configstore(pkg.name);
  }

  get(key) {
    if (this.store.has(key)) {
      const { validTill, data } = this.store.get(key);

      if (Date.now() < validTill) {
        return data;
      }
    }

    return null;
  }

  set(key, data, ttlInMs) {
    const validTill = Date.now() + ttlInMs;
    return this.store.set(key, { validTill, data });
  }
};
