#!/usr/bin/env node

var
  pkginfo = require('./package.json'),
  common = require('./lib/common'),
  core = require('./lib/os'),
  OSTask = core.OSTask,
  OSSlot = core.OSSlot,
  OSContext = core.OSContext;

common.getLogger('MAIN').info('START', {msg:'---------------------------------------------'});
core.mlog.info('-- oversee.js -- v' + pkginfo.version + ' --');

// --- test codes ----
var ctx = new OSContext("main");

var task = ctx.add(new OSTask({
  name: 't0', capacity:20, slot: 'default',
  cmd: 's1.sh'}));

ctx.add(new OSTask({
  name: 't1', from:['t0'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh'
}));

ctx.add(new OSTask({
  name: 't2', from:['t0'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh'
}));

ctx.add(new OSTask({
  name: 't3', from:['t0'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh'
}));

ctx.tidy();
ctx.start();
