var express = require('express');
var bodyParser = require('body-parser');
var google = require('googleapis');
var customsearch = google.customsearch('v1');
var request = require('request');
var cheerio = require('cheerio');

const CX = '014046724608856018103:lcrnmsifzw8';
const API_KEY = 'AIzaSyB1YP7dumynFwm1gJvSLklbsKoGP2LerV0';

var app = express();
app.use(bodyParser());

var postgres = require('./lib/postgres');

// Basic GET Function
app.get('/', function(req, res){ 
  res.sendFile(__dirname + '/templates/index.html');  
});


// POST function from submitting form on homepage
app.post('/scrape', function(req, res) {

  var searchstr = req.body.search;
  
  customsearch.cse.list({ cx: CX, q: searchstr, auth: API_KEY }, function(err, resp) {
    if (err) {
      console.log('An error occured', err);
      return;
    }
    // Got the response from custom search
    console.log('Result: ' + resp.searchInformation.formattedTotalResults);

    for (i = 0; i < resp.items.length; i++) {
      var weblink = resp.items[i].link;

      request(weblink, function(error, response, html){
        if(!error){
          var $ = cheerio.load(html);

          var title, release, rating;

          $('.header').filter(function(){
              var data = $(this);
              title = data.children().first().text();            
              release = data.children().last().children().text();
          });

          $('.star-box-giga-star').filter(function(){
              var data = $(this);
              rating = data.text();
          });

          var sql = 'INSERT INTO movies(title, year, rating) VALUES ($1, $2, $3)';
          postgres.client.query(sql, [title, release, rating], function(err, result) {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    }
  });

  res.sendFile(__dirname + '/templates/scrapecomplete.html');
});

module.exports = app;
