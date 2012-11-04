var 
  common = require("./common"),
  getLogger = common.getLogger,
  sprintf = common.sprintf;

var cp = require("child_process");

getLogger('MAIN').info('START', {msg:'---------------------------------------------'});

// -- global functions
var combineObject = function (source, defaults) {
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
}


// -- OSSlot 
function OSSlot(name, capacity) {
  this.name = name;
  this.capacity = capacity;
  this.rank = 0;
}


// -- OSTask 
function OSTask(conf, template) {
  this.conf = combineObject(conf, template);
  this.state = OSTask.STATE_ADDED;
  this.depends = [];
  this.blocks = [];
};


OSTask.STATE_ADDED = 'added';
OSTask.STATE_WAIT = 'waited';
OSTask.STATE_READY = 'ready';
OSTask.STATE_RUN = 'run';
OSTask.STATE_FAIL = 'fail';
OSTask.STATE_DONE = 'done';
OSTask.STATE_INVALID = 'invalid';
OSTask.STATE_CANCEL = 'cancel';


Object.defineProperty(OSTask.prototype, "name", {
  get: function() { return this.conf.name}
});


Object.defineProperty(OSTask.prototype, "priority", {
  get: function() {
    if (this.conf.priority) {
      return this.conf.priority;
    } else {
      return 0;
    }
  }
});


OSTask.prototype.dependOn = function(task) {
  if (this.depends.indexOf(task.name) == -1) {
    this.depends.push(task.name);
  }
  if (task.blocks.indexOf(this.name) == -1) {
    task.blocks.push(this.name)
  }
}


// -- OSContext 
function OSContext(id) {
  this.id = id;
  this.slots = {};
  this.tasks = {};

  this.waitTasks = [];
  this.readyTasks = [];
  this.runTasks = [];
  this.doneTasks = [];
  this.failTasks = [];
  this.cancelTasks = [];
  this.uncheckedTasks = [];

  this.doneTasks.state = OSTask.STATE_DONE;
  this.failTasks.state = OSTask.STATE_FAIL;
  this.cancelTasks.state = OSTask.STATE_CANCEL;
  this.waitTasks.state = OSTask.STATE_WAIT;
  this.readyTasks.state = OSTask.STATE_READY;
  this.runTasks.state = OSTask.STATE_RUN;

  this.log = getLogger('OSC:' + this.id);
};


OSContext.prototype.add = function (o) {
  if (o instanceof OSTask) {
    return this.addTask(o);
  }

  if (o instanceof OSSlot) {
    return this.addSlot(o);
  } 
}


OSContext.prototype.addSlot = function (slot) {
  this.slots[slot.name] = slot;
  this.log.debug('ADD.SLOT', {slot:slot});

  return slot;
};


OSContext.prototype.addTask = function (task) {
  var name = task.name;

  if (name in this.tasks) {
    this.log.debug('ERROR.DUPLICATED.TASK.NAME', {task:task});
    throw new Error('duplicated task name:' + name);
  }

  this.tasks[name] = task;
  this.uncheckedTasks.push(task);
  this.log.debug('ADD.TASK', {task:task});
  return task;
};


OSContext.prototype.tidy = function() {
  for (var tid  = 0 ; tid < this.uncheckedTasks.length; ++tid) {
    var task = this.uncheckedTasks[tid];
    var conf = task.conf;

    if (!(task.conf.slot in this.slots)) {
      console.log('--ISID--');
      task.state = OSTask.STATE_INVALID;
      task.tagline = "slot name is not found";
      this.log.debug("TIDY", {reason: "invalid-slot-id", task:task.name, id: conf.slot});
      continue;
    }


    if (typeof(conf.to) != 'undefined') {
      for (var taskid in conf.to) {
        var taskname = conf.to[taskid];
        var fireTask = self.tasks[taskname];
        if (typeof(fireTask) == 'undefined') {
          log.debug("TIDY", {
            reason: "invalid-to-task-id", task:task.name, id:taskname});
          continue;
        }

        if (fireTask.stat == OSTask.STATE_ADDED) {
          fireTask.dependOn(task);
        } else {
          log.debug("TIDY", {
            reason: "invalid-to-task-id2", task:task.name, id:taskname});
        }
      }
    }


    if (typeof(conf.from) != 'undefined') {
      for (var taskid in conf.from) {
        var taskname = conf.from[taskid];
        var depTask = this.tasks[taskname];

        if (typeof(depTask) == 'undefined') {
          task.state = OSTask.STATE_INVALID;
          task.tagline = "error dependencies";
          this.log.debug("TIDY", {
            reason: "invlide-from-task-id", task:task.name, id:taskname});
          continue;
        }
        task.dependOn(depTask);
      }
    }
  }

  var invalidTasks = {};
  var invalidQueue = [];

  // check dependencies
  for (var tid in this.uncheckedTasks) {
    var task = this.uncheckedTasks[tid];
    if (task.state == OSTask.STATE_INVALID) {
      invalidQueue.push(task.name);
    }
  }


  while (invalidQueue.length) {
    var name = invalidQueue.pop();
    if (name in invalidTasks) {
      continue;
    }

    invalidTasks[name] = name;
    var task = this.tasks[name];

    for (var id2 in task.blocks) {
      var name2 = task.blocks[id2];

      if (this.tasks[name2].state == OSTask.STATE_ADDED) {
        this.tasks[name2].state = OSTask.STATE_INVALID;
        invalidQueue.push(name2);
      }
    }
  }


  for (var tid in this.uncheckedTasks) {
    var task = this.uncheckedTasks[tid];

    if (task.state == OSTask.STATE_INVALID) {
      this.log.debug("TIDY", {reason:'drop-invalid-task', task: task.name});
      delete this.tasks[task.name];
    } else {
      if (task.depends.length == 0) {
        task.state = OSTask.STATE_READY;
        this.readyTasks.push(task);
      } else {
        task.state = OSTask.STATE_WAIT;
        this.waitTasks.push(task);
      }
    }
  }
  this.uncheckedTasks = [];
};


OSContext.prototype.run = function() {
  this.tick();
  var self = this;

  if (this.waitTasks.length
   + this.readyTasks.length
   + this.runTasks.length > 0) {
    this.tickId = setTimeout(function() { 
      self.run();
    }, 500);
  }
};


OSContext.prototype.tick = function() {
  
  var slots = {};
  
  if (this.readyTasks.length == 0) {
    return;
  }

  for (var sname in this.slots) {
    var slot = this.slots[sname];

    if (slot.rank < slot.capacity) {
      slots[sname] = [];
    }
  }

  if (slots.length == 0) {
    return;
  }

  var length = this.readyTasks.length;

  for (var i = 0; i < length; ++i) {
    var task = this.readyTasks[i];
    if (task.conf.slot in slots) {
      slots[task.conf.slot].push(task);
    }
  }


  var fireTasks = [];

  var slength = slots.length;
  for (var sname in slots) {
    var readyTasks = slots[sname];
    if (readyTasks.length == 0)
      continue;
    
    readyTasks.sort(function(t0, t1) {
      return t0.priority - t1.priority;
    });

    var slot = this.slots[sname];
    var avail = slot.capacity - slot.rank;

    while (avail > 0 && readyTasks.length > 0) {
      var task = readyTasks.pop();
      avail -= task.priority;
      fireTasks.push(task);
    }
  }

  var length = fireTasks.length;
  for (var i = 0; i < length; ++i) {
    var task = fireTasks[i];
    this.fire(task);
  }
  return;
};


OSContext.prototype.fire = function(task) {
  this.moveTask(task, this.readyTasks, this.runTasks);
  this.slots[task.conf.slot].rank += task.conf.capacity;
  this.log.debug("FIRE", {
    task: task, slot: task.conf.slot, capacity: task.conf.capacity});

  task.timeRun = new Date();
  task.child = cp.spawn(task.conf.cmd, task.conf.args, task.conf.opts);

  var self = this;
  task.child.on('exit', function(exitCode) {
    self.onTaskExit(task, exitCode);
  });
};


OSContext.prototype.onTaskExit = function(task, code) {
  this.slots[task.conf.slot].rank -= task.conf.capacity;

  task.timeExit = new Date();
  task.exitCode = code;
  if (code == 0) {
    this.moveTask(task, this.runTasks, this.doneTasks);

    for (var i = 0; i < task.blocks.length; ++i) {
      var name = task.blocks[i];
      var task2 = this.tasks[name];

      task2.depends.splice(task2.depends.indexOf(task.name), 1);

      if (task2.depends.length == 0 && task2.state == OSTask.STATE_WAIT) {
        this.moveTask(task2, this.waitTasks, this.readyTasks);
      } 
    }
  } else {
    this.moveTask(task, this.runTasks, this.failTasks);

    if (task.blocks.length != 0) {
      var cancelTasks = {};
      var cancelList = [];

      for (var i = 0; i < task.blocks.length; ++i) {
        var name = task.blocks[i];
        var btask = this.tasks[name];

        if (btask.state == OSTask.STATE_WAIT) {
          cancelList.push(btask);
        }
      }

      while (concelList.length) {
        var btask = cancelList.pop();

        if (btask.name in cancelTasks) {
          continue;
        }

        cancelTasks[btask.name] = btask;
        this.moveTask(btask, this.waitTasks, this.cancelTasks);

        if (btask.blocks.length) {
          for (var i = 0; i < btask.blocks.length; ++i) {
            var bname = btask.blocks[i];
            var bbtask = this.tasks[bname];

            if (bbtask.state == OSTask.STATE_WAIT) {
              if (bname in cancelTasks)
                continue;
              cancelList.push(bbtask);
            }
          }
        }
      }
    }
  }
}


OSContext.prototype.moveTask = function(task, from, to) {
  from.splice(from.indexOf(task), 1);
  to.push(task);
  if (to.state) {
    task.state = to.state;
  }
}


exports.OSSlot = OSSlot;
exports.OSTask = OSTask;
exports.OSContext = OSContext;
exports.combineObject = combineObject;


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
