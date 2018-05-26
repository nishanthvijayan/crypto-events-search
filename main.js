#!/usr/bin/env node

const CoinMarketCalendarClient = require('./Coinmarketcal');
const Table = require('tty-table')('automattic-cli-table');
const program = require('commander');
const { clientId, clientSecret } = require('./secrets.json').api;

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

    const type = event.categories.map(category => category.name).join(', ');

    table.push([coin, title, description, date, type, validity]);
  });

  console.log(table.toString());
}


async function getCoinIdsFromSymbols(coinSymbols) {
  if (coinSymbols == null || !Array.isArray(coinSymbols) || coinSymbols.length === 0) {
    return [];
  }

  const coinList = await client.getCoins();

  return coinList
    .filter(coin => coinSymbols.includes(coin.symbol.toUpperCase()))
    .map(coin => coin.id);
}


async function getCategoryIdsFromNames(categoryNames) {
  if (categoryNames == null || !Array.isArray(categoryNames) || categoryNames.length === 0) {
    return [];
  }

  const categoryList = await client.getCategories();

  return categoryList
    .filter(category => categoryNames.includes(category.name.toUpperCase()))
    .map(category => category.id);
}


async function fetchData({ coinSymbols = [], categoryNames = [] }) {
  const [categoryIds, coinIds] = await Promise.all([
    getCategoryIdsFromNames(categoryNames),
    getCoinIdsFromSymbols(coinSymbols),
  ]);

  const events = await client.getEvents({ coins: coinIds, categories: categoryIds });

  if (events && Array.isArray(events) && events.length > 0) {
    printEvents(events);
  } else {
    console.log('No events found');
  }
}


async function printTypes() {
  const types = await client.getCategories();

  if (types && Array.isArray(types) && types.length > 0) {
    console.log('Valid types are: ');
    console.log(types.map(type => type.name).join(', '));
  }
}


function main() {
  program
    .option('-c, --coins [symbols]', 'Comma separated list of coin symbols (Eg: btc,eth,req)')
    .option('-t, --types [types]', 'Comma separated list of event types to filter by (Eg: Roadmap,Airdrop)')
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
    printTypes();
  }
}


main();
