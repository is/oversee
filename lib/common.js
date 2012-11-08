var strformat = require('strformat');


exports.sprintf = require('extsprintf').sprintf;
exports.log4js = require('log4js');
exports.combineObject = function (source, defaults) {
  var dest = {};

  if (typeof(defaults) != 'undefined') {
    for (var key in defaults) {
      dest[key] = defaults[key];
    }
  }
  for (var key in source) {
    dest[key] = source[key];
  }
  return dest;
};


exports.fillDefaultObject = function(source, defaults) {
  if (typeof(defaults) == 'undefined')
    return source;

  for (var key in defaults) {
    if (!(key in source)) {
      source[key] = defaults[key];
    }
  }
  return source;
}


exports.fillDefault = function(source, key, value) {
  if (key in source)  
    return source;
  source[key] = value;
  return source;
};


exports.fillFormatDefault = function(source, key, value) {
  if (key in source)
    return source;
  source[key] = strformat(value, source);
  return source;
}

exports.strformat = strformat;
