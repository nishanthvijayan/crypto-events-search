#!/usr/bin/env node

const CoinMarketCalendarClient = require('./coinmarketcal');
const Table = require('tty-table')('automattic-cli-table');
const program = require('commander');
const { clientId, clientSecret } = require('./secrets.json').api;


function printEvents(events) {
  const table = new Table({
    head: ['Coin(s)', 'Title', 'Desc', 'Date', 'Validity (%)'],
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

    table.push([coin, title, description, date, validity]);
  });

  console.log(table.toString());
}


async function fetchData({ coins }) {
  const client = new CoinMarketCalendarClient({ clientId, clientSecret });

  const events = await client.getEvents({ coins });

  if (events && (Array.isArray(events) && events.length > 0)) {
    printEvents(events);
  } else {
    console.log('No events for found for', coins);
  }
}


function main() {
  program
    .option('-c, --coins [symbols]', 'Comma separated list of coin symbols (Eg: btc,eth,req)')
    // .option('-f, --filter', 'Comma separated list of category numbers to filter by')
    // .option('-l, --list', 'List all types of events')
    .parse(process.argv);


  if (program.coins) {
    fetchData({ coins: program.coins });
  } else {
    console.log('No coins specified. Use -c or --coins to specify coins Eg: --coins btc,omg,xmr');
  }
}


main();
