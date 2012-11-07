var 
  ctx = C,
  OSTask = os.OSTask,
  OSSlot = os.OSSlot;

ctx.conf.param = {
  day:'2012-10-33',
};

ctx.add(new OSTask({
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
