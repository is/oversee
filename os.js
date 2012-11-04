#!/usr/bin/env node

var
  common = require('./lib/common'),
  core = require('./lib/index'),
  OSTask = core.OSTask,
  OSSlot = core.OSSlot,
  OSContext = core.OSContext;

common.getLogger('MAIN').info('START', {msg:'---------------------------------------------'});
core.mlog.info('-- oversee.js --');

// --- test codes ----
var ctx = new OSContext("main");
var slot = ctx.add(new OSSlot('main', 80));
var slot = ctx.add(new OSSlot('default', 20));
var task = ctx.add(new OSTask({
  name: 't0', capacity:20, slot: 'default',
  cmd: './s1.sh'}));

ctx.add(new OSTask({
  name: 't1', from:['t0'], 
  capacity:20, slot: 'default',
  cmd: './s2.sh'
}));

ctx.add(new OSTask({
  name: 't2', from:['t0'], 
  capacity:20, slot: 'default',
  cmd: './s2.sh'
}));

ctx.add(new OSTask({
  name: 't3', from:['t0'], 
  capacity:20, slot: 'default',
  cmd: './s2.sh'
}));

ctx.tidy();
ctx.run();
