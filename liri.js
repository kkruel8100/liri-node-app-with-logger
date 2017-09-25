var keys = require("./keys.js");

var request = require("request");
var spotify = require("node-spotify-api");
var twitter = require("twitter");
var fs = require("fs");
var log = require('simple-node-logger').createSimpleLogger('log.txt');

var spotifyAPI = new spotify({
  id: keys.spotifyKeys.id,
  secret: keys.spotifyKeys.secret
});

var appRequest = process.argv[2];
var nodeArgs = process.argv;

var userRequest = "";
// capture user input after the application request position [2] and turn into string for query searches
for (var i = 3; i < nodeArgs.length; i++) {
  if (i > 3 && i < nodeArgs.length) {
    userRequest = userRequest + "+" + nodeArgs[i];
  } else {
    userRequest = nodeArgs[i];
  }
}

log.info("App requested: " + appRequest);
log.info("User requested: " + userRequest);

whichApp(appRequest);
// capture user application request
function whichApp(appRequest) {
  switch (appRequest) {
    case "spotify-this-song":
      spotifySong(userRequest);
      break;

    case "my-tweets":
      myTweets(userRequest);
      break;

    case "movie-this":
      movieThis(userRequest);
      break;

    case "do-what-it-says":
      doWhat();
      break;

    default:
      log.info("Please enter valid app.");
      break;
  }
}
// default: Ace of Base
function spotifySong(userRequest) {
  spotifyAPI.search({ type: 'track', query: userRequest }, function(err, data) {
    // if error show default
    if (err) {
      log.info("Song requested does not exist.  Check out: ");
      spotifyAPI.search({ type: 'track', query: 'All That She Wants' }, function(err, data) {
        if (err) {
          return log.info('Error occurred: ' + err);
        } else if (data) {
          var requestSong = data.tracks.items[0];
          songDisplay(requestSong);
        }
      });

      //if no error show request
    } else if (data) {
      var requestSong = data.tracks.items[0];
      songDisplay(requestSong);
    }
  });
}

// show Artist(s), Song's Name, Preview link of song from Spotify, Album song is from
function songDisplay(requestSong) {
  log.info("Name of Artist(s): " + requestSong.artists[0].name);
  log.info("Name of Song: " + requestSong.name);
  if (!requestSong.preview_url) {
    log.info("No preview link for song is available.");
  } else {
    log.info("Preview URL: " + requestSong.preview_url);
  }
  log.info("Name of Album: " + requestSong.album.name);
}

// request gets 20 tweets - show last 20 tweets (or number of tweets created if less than 20) and when they were created
function myTweets(userRequest) {
  var client = new twitter(keys.twitterKeys);
  var params = { screen_name: userRequest };
  client.get('statuses/user_timeline', params, function(error, tweets, response) {
    if (!error) {
      // loop to capture if results are less than 20 tweets and prevents error
      for (i = 0; i < tweets.length; i++) {
        log.info("Tweet number: " + (i + 1) + " - Text content: " + tweets[i].text);
        log.info("Created at: " + tweets[i].created_at);
      }
    } else {
      log.info("Twitter user not found.");
    }
  });
}

// default: Mr. Nobody
function movieThis(userRequest) {
  var movieUrl = "http://www.omdbapi.com/?t=" + userRequest + "&y=&plot=short&apikey=" + keys.omdbKey;
  request(movieUrl, function(error, response, body) {
    if (!error && response.statusCode === 200) {

      var requestMovie = JSON.parse(body);

      // captures undefined - movie not found
      if (requestMovie.Response === "False") {
        log.info("Movie requested not found.  Why don't you check out: ");
        var defaultMovieUrl = "http://www.omdbapi.com/?t=" + "Mr. Nobody" + "&y=&plot=short&apikey=" + keys.omdbKey;
        request(defaultMovieUrl, function(error, response, body) {
          if (!error && response.statusCode === 200) {

            var requestMovie = JSON.parse(body);
            movieDisplay(requestMovie);
          }
        });
      }
      // if movie found
      else {
        movieDisplay(requestMovie);
      }
    }
  });
}

// show Title of the movie, Year the movie came out, IMDB Rating of the movie, Rotten Tomatoes Rating of the movie, 
//Country where the movie was produced, Language of the movie, Plot of the movie, Actors in the movie 
function movieDisplay(requestMovie) {
  log.info("Title: " + requestMovie.Title);
  log.info("Year: " + requestMovie.Year);
  log.info("IMDB Rating: " + requestMovie.imdbRating);

  // Checks to see if Rotten Tomato ratings exist in ratings array
  var rotten = requestMovie.Ratings.length;
  var rottenExists = false;
  for (i = 0; i < rotten; i++) {
    if (requestMovie.Ratings[i].Source === "Rotten Tomatoes") {
      log.info("Rotten Tomatoes Rating: " + requestMovie.Ratings[i].Value);
      rottenExists = true;
    }
  }
  if (rottenExists === false) {
    log.info("No Rotten Tomatoes Rating available.");
  }
  log.info("Produced in: " + requestMovie.Country);
  log.info("Plot: " + requestMovie.Plot);
  log.info("Actors: " + requestMovie.Actors);
}

// take text from random.txt and use it to call one of LIRI's commands 
// if (appRequest === "do-what-it-says") {
function doWhat() {
  fs.readFile("random.txt", "utf8", function(err, data) {
    if (err) {
      return log.info(err);
    }

    // Break the string down by comma separation and store the contents into the output array.  Replace quotes with blanks for twitter because invalid user errors
    var output = data.split(",");
    var appRequest = output[0];
    userRequest = String(output[1]).replace(/"/g, "");
    whichApp(appRequest);
  });
}