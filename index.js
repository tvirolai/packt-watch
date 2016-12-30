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

scrape(url, sendMail);

function scrape(url, callback) {
  request(url, (err, res, body) => {
    if (err) throw err;
    else {
      let $ = cheerio.load(body);
      let title = $( selector ).text().trim();
      let description = $( descSelector ).text().trim();
      callback(title, description);
    }
  });
}

function readConfig(configFile, callback) {
  fs.readFile(configFile, 'utf-8', (err, res) => {
    res = JSON.parse(res);
    callback(res.user, res.password, res.host, res.to);
  });
}

function sendMail(title, description) {
  if (title) {
    readConfig('config.json', (user, pass, host, to) => {
      const server = email.server.connect({
        user: user,
        password: pass,
        host: host,
        ssl: true
      });
      server.send({
        text: title + '\n\n' + description + '\n\n' + url,
        from: 'Packt-watcher <packt-watcher@thou-shalt-not-reply.com>',
        to: to,
        subject: 'Now available: ' + title
      }, (err, message) => {
        if (err) throw err;
        else {
          console.log('Message sent.');
        }
      });
    });
  } else {
    console.log('No titles available today.')
  }
}

