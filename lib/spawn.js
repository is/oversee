var
  CP = require('child_process'),
  log4js = require('log4js'),
  spawn = CP.spawn,
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
}


exports.spawn_2 = function(ctx, task) {
  task.timeRun = new Date();

  var opts = ctx.taskSpawnOpts(task);

  // console.log('cmd:' + task.conf.cmd);
  // console.log('--opts--');
  // console.log(opts);
  task.child = spawn(task.conf.cmd, task.conf.args, opts);
  task.child.on('exit', function(exitCode) {
    ctx.onTaskExit(task, exitCode);
  });
  return task;

}
// vim:ts=2 sts=2 ai expandtab
