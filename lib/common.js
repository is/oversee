var jog = require("jog"),
  log = jog(new jog.FileStore('os.jog'));


exports.getLogger = function(name) {
  return log.ns({log: name});
};

exports.sprintf = require('extsprintf').sprintf;
exports.log4js = require('log4js');
