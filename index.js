/* jshint node: true */

'use strict';

process.chdir(__dirname);

const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');
const email = require('emailjs');

const selector = '#deal-of-the-day > div > div > div.dotd-main-book-summary.float-left > div.dotd-title > h2';
const descSelector = '#deal-of-the-day > div > div > div.dotd-main-book-summary.float-left > div:nth-child(4)';
const url = 'https://www.packtpub.com/packt/offers/free-learning';

const scrape = (url) => {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      if (err) {
        reject('Error!');
      } else {
        let $ = cheerio.load(body);
        let title = $( selector ).text().trim();
        let description = $( descSelector ).text().trim();
        resolve({'title': title, 'description': description});
      }
    });
  });
};

const readConfig = (configFile) => {
  return new Promise((resolve, reject) => {
    fs.readFile(configFile, 'utf-8', (err, res) => {
      if (err) reject('Error reading configfile.');
      else {
        resolve(JSON.parse(res));
      }
    });
  });
};

function sendMail(config, title, description) {
  if (title) {
    email.server.connect({
      user: config.user,
      password: config.pass,
      host: config.host,
      ssl: true
    }).send({
      text: title + '\n\n' + description + '\n\n' + url,
      from: `Packt-watcher <${config.to}>`,
      to: config.to,
      subject: 'Now available: ' + title
    }, (err) => {
      if (err) throw err;
      else {
        console.log('Message sent.');
      }
    });
  } else {
    console.log('No titles available today.');
  }
}

Promise.all([readConfig('config.json.bak'), scrape(url)]).then(data => {
  sendMail(data[0], data[1].title, data[1].description);
});
