window.MOVES = {
  punch:      {startup:3,  active:4,  recovery:8,  damage:5,  range:62, kb:2,  meterGain:6,  crouchHit:false, jumpHit:false, launch:false, cancelable:true},
  kick:       {startup:6,  active:4,  recovery:12, damage:9,  range:78, kb:4,  meterGain:8,  crouchHit:false, jumpHit:false, launch:false, cancelable:true},
  uppercut:   {startup:8,  active:5,  recovery:18, damage:14, range:55, kb:6,  meterGain:12, crouchHit:true,  jumpHit:false, launch:true,  cancelable:false},
  lowPunch:   {startup:3,  active:4,  recovery:9,  damage:5,  range:55, kb:2,  meterGain:6,  crouchHit:true,  jumpHit:false, launch:false, cancelable:true},
  sweep:      {startup:7,  active:4,  recovery:16, damage:10, range:72, kb:5,  meterGain:10, crouchHit:true,  jumpHit:false, launch:true,  low:true, cancelable:false},
  jumpAttack: {startup:3,  active:8,  recovery:4,  damage:10, range:70, kb:4,  meterGain:10, crouchHit:true,  jumpHit:true,  launch:false, cancelable:false},
  special:    {startup:12, active:10, recovery:22, damage:24, range:105,kb:12, meterGain:0,  crouchHit:true,  jumpHit:true,  launch:true,  special:true, cancelable:false}
};
