var
  fs = require('fs'),
  cp = require('child_process'),
  pty = require('pty.js'),
  strformat = require('strformat'),
  log4js = require('log4js'),
  spawn = cp.spawn,
  clog = log4js.getLogger('CO');

clog.setLevel('DEBUG');

exports.spawn_0 = function(ctx, task) {
  task.timeRun = new Date();
  task.child = spawn(task.conf.cmd, task.conf.args, task.conf.opts);
  task.child.stdout.on('data', function(data) {
    clog.debug('[' + task.name + ']: ' + data.toString().replace(/(\r\n|\n|\r)/gm,""));
  });
  task.child.stderr.on('data', function(data) {
    clog.debug('[' + task.name + ']: ' + data.toString().replace(/(\r\n|\n|\r)/gm,""));
  });
  task.child.on('exit', function(exitCode) {
    ctx.onTaskExit(task, exitCode);
  });
  return task;
};



exports.spawn_pty = function(ctx, task) {
  task.timeRun = new Date();

  var opts = ctx.taskSpawnOpts(task);

  if (task.conf.args && task.conf.args_param) {
    for (var i = 0; i < task.conf.args.length; ++i) {
      task.conf.args[i] = strformat(task.conf.args[i], task.conf.param);
    }
  }

 
  opts.cols = 80;
  opts.rows = 30;
  opts.name = "ansi";

  // var term = pty.open2(opts);
  var term = pty.open(opts);

  term.on('data', function(data) {
    console.log('TERM-DATA:' , data);
  });
  term.on('error', function(err) {
    console.log('TERM-ERRO:', err);
  });

  opts.stdio = [term.slave, task.logOut, task.logErr];
  // opts.stdio = [term.fdslave, term.fdslave, term.fdslave];
  // console.log('opts', opts)
  // task.child = pty.spawn(task.conf.cmd, task.conf.args, opts);
  task.child = spawn(task.conf.cmd, task.conf.args, opts);
  // console.log('child', task.child);

  task.child.on('data', function(data) {
    fs.write(task.logOut, data);
  });

  task.child.on('exit', function(exitCode) {
    ctx.onTaskExit(task, exitCode);
  });
  return task;
};

exports.spawn_2 = function(ctx, task) {
  task.timeRun = new Date();

  var opts = ctx.taskSpawnOpts(task);

  if (task.conf.args && task.conf.args_param) {
    for (var i = 0; i < task.conf.args.length; ++i) {
      task.conf.args[i] = strformat(task.conf.args[i], task.conf.param);
    }
  }

  task.child = spawn(task.conf.cmd, task.conf.args, opts);
  task.child.on('exit', function(exitCode) {
    ctx.onTaskExit(task, exitCode);
  });
  return task;

}
// vim:ts=2 sts=2 ai expandtab
