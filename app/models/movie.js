// app/models/movie.js

// load mongoose since we need it to define a model
var mongoose = require('mongoose');

module.exports = mongoose.model('Movie', {
    movieTitle : String,
    movieYear: String,
    movieRating: String
});