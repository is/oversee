// C.param.day = '2012-10-33';

fill(C.param, 'day', '2012-10-33')

C.add(new OSTask({
  name: 't0-{day}', capacity:20, slot: 'default',
  cmd: 's1.sh'}));

C.add(new OSTask({
  name: 't1', dep:['t0-{day}'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh',
  args: ['{day}'],
  args_param: true,
}));

C.add(new OSTask({
  name: 't2', dep:['t0-{day}'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh'
}));

C.add(new OSTask({
  name: 't3', dep:['t0-{day}'], 
  capacity:20, slot: 'default',
  cmd: 's2.sh',
}));
