var express = require('express');
var bodyParser = require('body-parser');
var google = require('googleapis');
var customsearch = google.customsearch('v1');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose'); 

const CX = '014046724608856018103:lcrnmsifzw8';
const API_KEY = 'AIzaSyDsYAvDbEuKxcN0XRaf_LQv2c39Uh3HMrQ';

var app = express();
app.use(bodyParser());

/*  ENABLE FOR POSTGRES */
// var postgres = require('./lib/postgres');

/*  ENABLE FOR MONGO */
var database = require('./lib/mongo');    // database connect info
mongoose.connect(database.url);                 // connect to mongoDB
var Movie = require('./app/models/movie');

// Basic GET Function
app.get('/', function(req, res){ 
  res.sendFile(__dirname + '/templates/index.html');  
});

// POST function from submitting form on homepage
app.post('/scrape', function(req, res) {

  var searchstr = req.body.search;
  var movies = [];
  
  customsearch.cse.list({ cx: CX, q: searchstr, auth: API_KEY }, function(err, resp) {
    if (err) {
      console.log('An error occured', err);
      return;
    }

    // Got the response from custom search
    // @NOTE: enable these if you want to see what is being returned
    // console.log(resp.searchInformation);
    // console.log('Result: ' + resp.searchInformation.formattedTotalResults);
    // console.log(resp.items);

    for (i = 0; i < resp.items.length; i++) {
      var weblink = resp.items[i].link;

      request(weblink, function(error, response, html){
        if(!error){

          var $ = cheerio.load(html);

          var title, release, rating;

          $('.titleBar').filter(function(){
              var data = $(this);
              title = data.children('.title_wrapper').children('h1').text();            
              release = data.children('.title_wrapper').children('h1').children('#titleYear').children('a').text();
          });

          $('.imdbRating').filter(function(){
              var data = $(this).children('.ratingValue').children('strong').children('span');
              rating = data.text();
          });

          var themovie = {movieTitle: title, movieYear: release, movieRating: rating};
          movies.push(themovie);

          /* ENABLE FOR POSTGRES */
          // var sql = 'INSERT INTO movies(title, year, rating) VALUES ($1, $2, $3)';
          // postgres.client.query(sql, [title, release, rating], function(err, result) {
          //   if (err) {
          //     console.log(err);
          //   }
          // });

          /* ENABLE FOR MONGO */
          Movie.create(themovie, function(err, movie) {
              if (err)
                  res.send(err);
          });
        }
      });
    }
  });

  res.sendFile(__dirname + '/templates/scrapecomplete.html');
});

module.exports = app;
