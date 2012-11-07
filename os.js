#!/usr/bin/env node

var
  pkginfo = require('./package.json'),
  common = require('./lib/common'),
  core = require('./lib/index'),
  OSTask = core.OSTask,
  OSSlot = core.OSSlot,
  OSContext = core.OSContext;

common.getLogger('MAIN').info('START', {msg:'---------------------------------------------'});
core.mlog.info('-- oversee.js -- v' + pkginfo.version + ' --');

// --- test codes ----
var ctx = new OSContext("main");
ctx.configJSFile('os-cfg.js');
ctx.start();
