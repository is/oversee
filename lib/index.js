var common = require("./common"),
  getLogger = common.getLogger,
  sprintf = common.sprintf;


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
  this.rank = capacity;
}


// -- OSTask 
function OSTask(conf, template) {
  this.conf = combineObject(conf, template);
  this.state = OSTask.STATE_ADDED;
  this.depends = [];
  this.triggers = [];
};


OSTask.STATE_ADDED = 'added';
OSTask.STATE_WAITED = 'waited';
OSTask.STATE_READY = 'ready';
OSTask.STATE_RUN = 'run';
OSTask.STATE_FAIL = 'fail';
OSTask.STATE_DONE = 'done';
OSTask.STATE_INVALID = 'invalid';


Object.defineProperty(OSTask.prototype, "name", {
  get: function() { return this.conf.name}
});


OSTask.prototype.dependOn = function(task) {
  if (this.depends.indexOf(task.name) == -1) {
    this.depends.push(task.name);
  }
  if (task.triggers.indexOf(this.name) == -1) {
    task.triggers.push(this.name)
  }
}


// -- OSContext 
function OSContext() {
  this.slots = {};
  this.tasks = {};

  this.readyTasks = [];
  this.waitTasks = [];
  this.uncheckedTasks = [];

  this.log = getLogger('osContext');
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


OSContext.prototype.precheck = function() {
  console.log('precheck');

  for (var tid in this.uncheckedTasks) {
    var task = this.uncheckedTasks[tid];
    var conf = task.conf;

    if (!conf.slot in this.slots) {
      task.state = OSTask.STATE_INVALID;
      task.tagline = "slot name is not found";
      log.debug("PRECHECK", {reason: "invalid-slot-id", task:task.name, id: conf.slot});
      continue;
    }


    if (typeof(conf.to) != 'undefined') {
      for (var taskid in conf.to) {
        var taskname = conf.to[taskid];
        var fireTask = self.tasks[taskname];
        if (typeof(fireTask) == 'undefined') {
          log.debug("PRECHECK", {reason: "invalid-to-task-id", task:task.name, id:taskname});
          continue;
        }

        if (fireTask.stat == OSTask.STATE_ADDED) {
          fireTask.dependOn(task);
        } else {
          log.debug("PRECHECK", {reason: "invalid-to-task-id2", task:task.name, id:taskname});
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
          this.log.debug("PRECHECK", {reason: "invlide-from-task-id", task:task.name, id:taskname});
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

    for (var id2 in task.triggers) {
      var name2 = task.triggers[id2];

      if (this.tasks[name2].state == OSTask.STATE_ADDED) {
        this.tasks[name2].state = OSTask.STATE_INVALID;
        invalidQueue.push(name2);
      }
    }
  }


  for (var tid in this.uncheckedTasks) {
    var task = this.uncheckedTasks[tid];
    if (task.state == OSTask.STATE_INVALID) {
      this.log.debug("PRECHECK", {reason:'drop-invalid-task', task: task.name});
      delete this.tasks[task.name];
    } else {
      if (task.depends.length == 0) {
        task.state = OSTask.STATE_READY;
        this.readyTasks.push(task);
      } else {
        this.state = OSTask.STATE_WAITED;
        this.waitTasks.push(task);
      }
    }
  }

  this.uncheckedTasks = [];
};

exports.OSSlot = OSSlot;
exports.OSTask = OSTask;
exports.OSContext = OSContext;
exports.combineObject = combineObject;

var ctx = new OSContext();
var slot = ctx.add(new OSSlot("hello", 30));
var task = ctx.add(new OSTask({name: 't0', capacity:20, slot: 'default'}));
var task = ctx.add(new OSTask(
  {name: 't1', from:['t0'], capacity:20, slot: 'default'}));

ctx.precheck();

console.log(slot);
console.log(task);
console.log(ctx.tasks.t0);