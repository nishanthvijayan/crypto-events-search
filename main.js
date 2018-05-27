#!/usr/bin/env node

const CoinMarketCalendarClient = require('./Coinmarketcal');
const Table = require('tty-table')('automattic-cli-table');
const program = require('commander');
const Cache = require('./Cache');
const pkgName = require('./package.json').name;


function printEvents(events) {
  const table = new Table({
    head: ['Coin(s)', 'Title', 'Desc', 'Date', 'Type', 'Validity (%)'],
  });

  events.forEach((event) => {
    const { title, description } = event;

    const date = new Date(event.date_event).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const validity = event.percentage;

    const coin = event.coins
      .filter(({ id }) => id !== 'custom_coin')
      .map(({ symbol }) => symbol)
      .join(', ');

    const type = event.categories.map(category => category.name).join(', ');

    table.push([coin, title, description, date, type, validity]);
  });

  console.log(table.toString());
}


async function getCoinIdsFromSymbols(coinmarketcalApi, coinSymbols) {
  if (coinSymbols == null || !Array.isArray(coinSymbols) || coinSymbols.length === 0) {
    return [];
  }

  const coinList = await coinmarketcalApi.getCoins();

  return coinList
    .filter(coin => coinSymbols.includes(coin.symbol.toUpperCase()))
    .map(coin => coin.id);
}


async function getCategoryIdsFromNames(coinmarketcalApi, categoryNames) {
  if (categoryNames == null || !Array.isArray(categoryNames) || categoryNames.length === 0) {
    return [];
  }

  const categoryList = await coinmarketcalApi.getCategories();

  return categoryList
    .filter(category => categoryNames.includes(category.name.toUpperCase()))
    .map(category => category.id);
}


async function fetchEvents(coinmarketcalApi, { coinSymbols = [], categoryNames = [] }) {
  const [categoryIds, coinIds] = await Promise.all([
    getCategoryIdsFromNames(coinmarketcalApi, categoryNames),
    getCoinIdsFromSymbols(coinmarketcalApi, coinSymbols),
  ]);

  const events = await coinmarketcalApi.getEvents({ coins: coinIds, categories: categoryIds });

  if (events && Array.isArray(events) && events.length > 0) {
    printEvents(events);
  } else {
    console.log('No events found');
  }
}


async function displayAvailableTypes(coinmarketcalApi) {
  const types = await coinmarketcalApi.getCategories();

  if (types && Array.isArray(types) && types.length > 0) {
    console.log('Valid types are: ');
    console.log(types.map(type => type.name).join(', '));
  }
}


function standardize(values) {
  return values
    .split(',')
    .map(symbol => symbol.trim().toUpperCase());
}


function displaySetCredentailsMessage() {
  console.log('No API credentails found');
  console.log('Register at https://api.coinmarketcal.com/developer/register to get you API client Id and secret');
  console.log('Use --config CLIENTID:CLIENTSECRET to set API credentials');
  console.log('Example: $ crypto_news --config dummyclientid123:fakeclientsecret456');
}


function displayExampleUsage() {
  console.log('  Examples:');
  console.log('');
  console.log(`    $ ${pkgName} --config dummyclientid123:fakeclientsecret456`);
  console.log(`    $ ${pkgName} -c omg,etc`);
  console.log(`    $ ${pkgName} --coins omg,etc`);
  console.log(`    $ ${pkgName} -t roadmap,burn`);
  console.log(`    $ ${pkgName} --types roadmap,burn`);
  console.log(`    $ ${pkgName} -c omg,etc -t roadmap,burn`);
  console.log('');
}


function main() {
  program
    .option('-c, --coins <symbols>', 'Comma separated list of coin symbols (Eg: btc,eth,req)', standardize)
    .option('-t, --types <types>', 'Comma separated list of event types to filter by (Eg: Roadmap,Airdrop)', standardize)
    .option('-l, --list', 'List all categories')
    .option('--config <cliendId:clientSecret>', 'Set CoinMarketCal API credentials')
    .parse(process.argv);


  const Store = new Cache();

  if (program.config) {
    const [clientId, clientSecret] = program.config.split(':');
    Store.set('credentials', { clientId, clientSecret });
    console.log('API credentails set.');
    process.exit();
  }


  const { clientId, clientSecret } = Store.get('credentials');
  if (clientId == null || clientSecret == null) {
    displaySetCredentailsMessage();
    process.exit();
  }


  const coinmarketcalApi = new CoinMarketCalendarClient({ clientId, clientSecret });

  if (program.coins || program.types) {
    const params = {};

    if (program.coins) {
      params.coinSymbols = program.coins;
    }

    if (program.types) {
      params.categoryNames = program.types;
    }

    fetchEvents(coinmarketcalApi, params);
  } else if (program.list) {
    displayAvailableTypes(coinmarketcalApi);
  } else {
    console.log("No input params detected\n");
    displayExampleUsage();
    displayAvailableTypes(coinmarketcalApi);
  }
}


main();
