var
  fs = require('fs'),
  cp = require('child_process'),
  path = require('path'),
  strformat = require('strformat'),
  strftime = require('strftime'),
  mkdirp = require('mkdirp'),
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



exports.spawn_2 = function(ctx, task) {
  task.timeRun = new Date();

  var opts = ctx.taskSpawnOpts(task);

  if (ctx.conf.task_log === 'file') {
    var now = new Date();
    task.logPath = strformat(ctx.conf.logfile_pattern, {
      log_dir: ctx.conf.log_dir, name:task.name, 
      ts: now.getTime(), timefmt2: strftime('%Y%m%d-%H%M%S', now),
    });

    mkdirp.sync(path.dirname(path.resolve(task.logPath)));

    task.logOut = fs.openSync(task.logPath, ctx.conf.logfile_openmode);
    task.logErr = fs.openSync(task.logPath, ctx.conf.logfile_openmode);

    opts.stdio = ['ignore', task.logOut, task.logErr];
  }

  if (ctx.conf.task_log === 'console') {
    opts.stdio = 'inherit';
  }

  if (task.conf.pty) {
    if (task.conf.args) {
      task.conf.args.splice(0, 0, task.conf.cmd);
    } else {
      task.conf.args = [task.conf.cmd];
    }
    task.conf.cmd = 'openpty';
    // opts.stdio[0] = process.stdin;
  }

  if (task.conf.args && task.conf.args_param) {
    for (var i = 0; i < task.conf.args.length; ++i) {
      task.conf.args[i] = strformat(task.conf.args[i], task.conf.param);
    }
  }

  task.child = spawn(task.conf.cmd, task.conf.args, opts);
  task.child.on('exit', function(exitCode, killSignal) {
    if (task.logOut) {
      fs.close(task.logOut);
      delete task.logOut;
    }
  
    if (task.logErr) {
      fs.close(task.logErr);
      delete task.logErr;
    }
   
    ctx.onTaskExit(task, exitCode, killSignal);
  });
  return task;

}
// vim:ts=2 sts=2 ai expandtab
