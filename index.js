'use strict';

const TENDIES = "Breaded Chicken Tenders";

const https = require('https');

const api = "https://tuftsdiningdata.herokuapp.com/menus/";

const Alexa = require('alexa-sdk');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

const halls = ["carm", "dewick"];

const handlers = {
    'LaunchRequest': function () {
        this.emit('tendies');
    },
    'tendies': function () {
        var alexa = this;

        // Convert server time to Eastern Time
        var moment = require("moment-timezone");
        var date = moment();
        var now = date.tz("America/New_York");
        var day = now.date();
        var month = now.month() + 1;
        var year = now.year();
        var date = day + "/" + month + "/" + year;

        // Use array of promises, one for each hall
        var promises = [];
        for (var hkey in halls) {
            var hall = halls[hkey];
            promises.push(queryAPI(hall, date));
        }

        // Format output when get requests are done
        Promise.all(promises).then(values => {
            var msg = "There are tendies in ";
            var count = 0;
            for (var key in values) {
                if (values[key] == 0) {
                    continue;
                } else {
                    msg += values[key] + " and ";
                    count++;
                }
            }

            if (count == 0) {
                msg = "There are no tendies at Tufts today";
            } else {
                msg = msg.substr(0, msg.length - 5);
            }

            alexa.emit(":tell", msg);
        });
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', "Try asking: Are there tendies?");
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', "Goodbye");
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', "Goodbye");
    },
    'Unhandled': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that.');
    }
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// API call
// Thank you dyang108
// https://github.com/dyang108/diningdata/
function queryAPI(hall, date) {
    return new Promise((resolve, reject) => {
        var url = api + hall + "/" + date;
        https.get(url, res => {
            res.setEncoding("utf8");

            var body = "";
            res.on("data", data => {
                body += data;
            });

            res.on("end", () => {
                body = JSON.parse(body);
                for (var mkey in body.data) {

                    var meal = body.data[mkey];
                    for (var ckey in meal) {

                        var category = meal[ckey];
                        for (var fkey in category) {

                            var food = category[fkey];
                            if (food == TENDIES) {
                                resolve(hall);
                            }
                        }
                    }
                }
                resolve(0);
            });
        });
    });
}