var jog = require("jog"),
  log = jog(new jog.FileStore('/tmp/tail'));


//log.stream({end:true, interval:500})
//  .on('data', function(obj) {
//    console.log(obj);
//  });

exports.getLogger = function(name) {
  return log.ns({log: name});
}

exports.sprintf = require('extsprintf').sprintf;
exports.log4js = require('log4js');