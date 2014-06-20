/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , googleapis = require('googleapis')
    , OAuth2Client = googleapis.OAuth2Client
    , config = require('./config.json');

var oauth2Client = new OAuth2Client(config.CLIENT_ID,
    config.CLIENT_SECRET, config.REDIRECT_URL);
// Use environment variables to configure oauth client.
// That way, you never need to ship these values, or worry
// about accidentally committing them
// var oauth2Client = new OAuth2Client(process.env.MIRROR_DEMO_CLIENT_ID,
//     process.env.MIRROR_DEMO_CLIENT_SECRET, process.env.MIRROR_DEMO_REDIRECT_URL);



var app = express();

// all environments
app.set('port', 8081);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

var success = function (data) {
    console.log('success', data);
};
var failure = function (data) {
    console.log('failure', data);
};
var gotToken = function () {
    googleapis
        .discover('mirror', 'v1')
        .execute(function (err, client) {
            if (!!err) {
                failure();
                return;
            }
            console.log('mirror client', client);
            // listTimeline(client, failure, success);
            // insertHello(client, failure, success);
            // insertContact(client, failure, success);
            insertObStrat(client, failure, success);
            // insertLocation(client, failure, success);
        });
};
//send an oblique strategy to glass
var insertObStrat = function (client, errorCallback, successCallback){
    var obstrat = require('./obstrat.js');
    console.log(Math.random[obstrat.length]);
    client.
        mirror.timeline.insert(
        {
            "text": obstrat[Math.random[obstrat.length]],
            "callbackUrl": "https://mirrornotifications.appspot.com/forward?url=http://glasspire.kaotec.org:8081/reply",  ////callback need to be SSLed, for dev you can proxy through googles testproxy mirrornotifications
            "menuItems": [
                {"action": "REPLY"},
                {"action": "DELETE"},
                {"action": "CUSTOM"},
                {"type": "TAKE_A_NOTE"}
            ],
            "speakableType":"oblique strategy"
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};

var listTimeline = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.list()
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};

var grabToken = function (code, errorCallback, successCallback) {
    oauth2Client.getToken(code, function (err, tokens) {
        if (!!err) {
            errorCallback(err);
        } else {
            console.log('tokens', tokens);
            oauth2Client.credentials = tokens;
            successCallback();
        }
    });
};

app.get('/', function (req, res) {
    if (!oauth2Client.credentials) {
        // generates a url that allows offline access and asks permissions
        // for Mirror API scope.
        var url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/glass.timeline'
        });
        res.redirect(url);
    } else {
        gotToken();
        console.log(listTimeline);
    }
    res.write('Glass Mirror API with Node');
    res.end();

});
app.get('/oauth2callback', function (req, res) {
    // if we're able to grab the token, redirect the user back to the main page
    grabToken(req.query.code, failure, function () {
        res.redirect('/');
    });
});

app.post('/reply', function(req, res){
    console.log('replied',req);
    res.send(200);
    res.end();
});

app.post('/location', function(req, res){
    console.log('location',req);
    res.end();
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
