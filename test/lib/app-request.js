var request = require('request');

var util = require('./util');
var app = util.getApp();

module.exports = function appRequest(options, cb) {
  if (typeof(options) == 'string') options = {url: options};

  if (!('followAllRedirects' in options))
    options.followAllRedirects = true;
  app.db = options.db || util.level();
  util.serve(app, function(server) {
    options.url = server.baseURL + options.url;
    request(options, function(err, res, body) {
      server.close();
      cb(err, res, body, app.db);
    });
  });
};
