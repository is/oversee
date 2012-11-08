assert(C.param.day, "missing param 'day'");
C.templateTaskConf = { capacity: 10, slot: 'default' };
C.slots.default.capacity = 80;

TA({name: 't0-{day}', capacity:20, slot: 'default', cmd: 's1.sh'});
TA({name: 't1', dep:['t0-{day}'], capacity:20, slot: 'default',
  cmd: 's2.sh', args: ['{day}'], args_param: true, });
TA({name: 't2', dep:['t0-{day}'], cmd: 's2.sh'});
TA({name: 't3', dep:['t0-{day}'], cmd: 's2.sh'});
