#!/usr/bin/env node

const CoinMarketCalendarClient = require('./coinmarketcal');
const Table = require('tty-table')('automattic-cli-table');
const program = require('commander');
const { clientId, clientSecret } = require('./secrets.json').api;
const Cache = require('./Cache');

const client = new CoinMarketCalendarClient({ clientId, clientSecret });

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

    const type = event.categories.map(category => category.name).join(', ')

    table.push([coin, title, description, date, type, validity]);
  });

  console.log(table.toString());
}


async function getCoinList() {
  let cachedCoinList = Cache.getCachedCoinList();
  if (cachedCoinList == null) {
    const coinList = await client.getCoins();

    if (coinList == null) {
      console.log('Something went wrong. Try again later. Contact the author if the problem persists');
      process.exit();
    } else {
      Cache.cacheCoinList(coinList);
      cachedCoinList = coinList;
    }
  }

  return cachedCoinList;
}


function getCoinIdsFromSymbols(coinSymbols, coinList) {
  return coinList
    .filter(coin => coinSymbols.includes(coin.symbol.toUpperCase()))
    .map(coin => coin.id);
}


async function getCategoyList() {
  let cachedCategoryList = Cache.getCachedCategoryList();
  if (cachedCategoryList == null) {
    const categoryList = await client.getCategories();

    if (categoryList == null) {
      console.log('Something went wrong. Try again later. Contact the author if the problem persists');
      process.exit();
    } else {
      Cache.cacheCategoryList(categoryList);
      cachedCategoryList = categoryList;
    }
  }

  return cachedCategoryList;
}


function getCategoryIdsFromNames(categoryNames, categoryList) {
  return categoryList
    .filter(category => categoryNames.includes(category.name.toUpperCase()))
    .map(category => category.id);
}


async function fetchData({ coinSymbols = [], categoryNames = [] }) {
  const categoryList = await getCategoyList();
  const categoryIds = getCategoryIdsFromNames(categoryNames, categoryList);

  const coinList = await getCoinList();
  const coinIds = getCoinIdsFromSymbols(coinSymbols, coinList);

  const events = await client.getEvents({ coins: coinIds, categories: categoryIds });

  if (events && (Array.isArray(events) && events.length > 0)) {
    printEvents(events);
  } else {
    console.log('No events for found for', coinSymbols);
  }
}


async function printTypes() {
  const types = await getCategoyList();
  console.log(types.map(type => type.name).join(', '));
}


function main() {
  program
    .option('-c, --coins [symbols]', 'Comma separated list of coin symbols (Eg: btc,eth,req)')
    .option('-t, --types [types]', 'Comma separated list of event types to filter by (Eg: Roadmap,Airdrop)')
    // .option('-l, --list', 'List all types of events')
    .parse(process.argv);


  if (program.coins || program.types) {
    const params = {};

    if (program.coins) {
      params.coinSymbols = program.coins
        .split(',')
        .map(symbol => symbol.trim().toUpperCase());
    }

    if (program.types) {
      params.categoryNames = program.types
        .split(',')
        .map(category => category.trim().toUpperCase());
    }

    fetchData(params);
  } else {
    console.log('No coins or types specified\n');
    console.log('Use -c or --coins to specify coins Eg: --coins btc,omg,xmr');
    console.log('Use -t or --t to filter event by types Eg: --types roadmap,airdrop\n');
    console.log('Valid types are: ');
    printTypes();
  }
}


main();
