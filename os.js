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

ctx.conf.param = {
  day:'2012-10-33',
};

var task = ctx.add(new OSTask({
  name: 't0-{day}', capacity:20, slot: 'default',
  cmd: 's1.sh'}));

ctx.add(new OSTask({
  name: 't1', dep:['t0-{day}'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh',
  args: ['{day}'],
  args_param: true,
}));

ctx.add(new OSTask({
  name: 't2', dep:['t0-{day}'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh'
}));

ctx.add(new OSTask({
  name: 't3', dep:['t0-{day}'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh',
}));

ctx.tidy();
ctx.start();
