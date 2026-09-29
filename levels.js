"use strict";

// Data-only campaign setup. Level 1 deliberately keeps the original path in game.js.
const LEVEL_DEFINITIONS = Object.freeze([
  {number:1,name:"Referenzpfad",hp:{first:5,last:5500},snakes:[{id:"A",path:{type:"level1"}}]},
  {number:2,name:"Große Wellen",hp:{first:15,last:9000},snakes:[{id:"A",path:{type:"wave",cycles:10,amplitude:.49,phase:-.25}}]},
  {number:3,name:"Getrennte Seiten",hp:{first:32,last:14500},snakes:[
    {id:"A",side:"left",path:{type:"sideWave",cycles:9,amplitude:.25,center:.26,phase:0}},
    {id:"B",side:"right",path:{type:"sideArc",cycles:8,amplitude:.25,center:.74,phase:Math.PI}}
  ]},
  {number:4,name:"S-Kurven",hp:{first:50,last:22000},snakes:[{id:"A",path:{type:"sCurve",cycles:14,amplitude:.49,phase:0}}]},
  {number:5,name:"Kreuzende Wege",hp:{first:94,last:40000},snakes:[
    {id:"A",path:{type:"cross",cycles:14,amplitude:.36,phase:0,direction:1}},
    {id:"B",path:{type:"cross",cycles:14,amplitude:.36,phase:Math.PI,direction:-1}}
  ]},
  {number:6,name:"Große Bögen",hp:{first:138,last:56250},snakes:[{id:"A",path:{type:"arcs",cycles:12,amplitude:.49,phase:0}}]},
  {number:7,name:"Wechselnde Kurvenradien",hp:{first:200,last:77500},snakes:[{id:"A",path:{type:"variable",cycles:13,amplitude:.50,phase:0,bottomCompression:.16}}]},
  {number:8,name:"Geteilte Muster",hp:{first:288,last:102500},snakes:[
    {id:"A",path:{type:"wave",cycles:10,amplitude:.49,phase:0}},
    {id:"B",path:{type:"sCurve",cycles:15,amplitude:.49,phase:Math.PI}}
  ]},
  {number:9,name:"Komplexer Rundkurs",hp:{first:400,last:135000},snakes:[{id:"A",path:{type:"complex",cycles:14,amplitude:.53,phase:0}}]},
  {number:10,name:"Finales Trio",hp:{first:563,last:175000},snakes:[
    {id:"A",side:"left",path:{type:"wave",cycles:22,amplitude:.25,center:.26,phase:0}},
    {id:"B",side:"center",rage:{interval:15,duration:3,multiplier:1.2},path:{type:"finalTight",cycles:26,amplitude:.49,center:.5,phase:0}},
    {id:"C",side:"right",path:{type:"wave",cycles:22,amplitude:.25,center:.74,phase:Math.PI}}
  ]},
  {number:11,name:"Senkrechter Rücklauf",hp:{first:675,last:215000},snakes:[{id:"A",path:{type:"verticalReturn",dense:true}}]},
  {number:12,name:"Diagonale Ecken",hp:{first:810,last:260000},snakes:[{id:"A",path:{type:"diagonalCorners",dense:true}}]},
  {number:13,name:"Gekreuzte Diagonalen",hp:{first:972,last:315000},snakes:[
    {id:"A",path:{type:"diagonalCorners",dense:true}},
    {id:"B",path:{type:"diagonalCorners",mirrorX:true,dense:true}}
  ]},
  {number:14,name:"Spirale im Uhrzeigersinn",hp:{first:1166,last:380000},snakes:[{id:"A",path:{type:"rectSpiral"}}]},
  {number:15,name:"Gegenspiralen",hp:{first:1399,last:460000},snakes:[
    {id:"A",path:{type:"rectSpiral"}},
    {id:"B",path:{type:"rectSpiral",mirrorX:true}}
  ]},
  {number:16,name:"Säulenwechsel",hp:{first:1679,last:555000},snakes:[{id:"A",path:{type:"verticalColumns",dense:true}}]},
  {number:17,name:"Eckenrundkurs",hp:{first:2015,last:670000},snakes:[{id:"A",path:{type:"cornerCircuit",dense:true}}]},
  {number:18,name:"Gespiegelter Rücklauf",hp:{first:2418,last:810000},snakes:[
    {id:"A",path:{type:"verticalReturn",dense:true}},
    {id:"B",path:{type:"verticalReturn",mirrorX:true,dense:true}}
  ]},
  {number:19,name:"Spirale gegen den Uhrzeigersinn",hp:{first:2902,last:980000},snakes:[{id:"A",path:{type:"rectSpiral",mirrorX:true}}]},
  {number:20,name:"Synchrones Trio",hp:{first:3482,last:1180000},snakes:[
    {id:"A",path:{type:"diagonalWeave",dense:true,xShift:-.035}},
    {id:"B",path:{type:"diagonalWeave",mirrorX:true,dense:true}},
    {id:"C",path:{type:"diagonalWeave",dense:true,xShift:.035}}
  ]},
  {number:21,name:"Diamantlauf",hp:{first:4178,last:1420000},snakes:[{id:"A",path:{type:"diamondSweep",dense:true}}]},
  {number:22,name:"Enge Gegenspirale",hp:{first:5014,last:1710000},snakes:[{id:"A",path:{type:"rectSpiral",mirrorX:true,compact:true}}]},
  {number:23,name:"Doppelter Diamant",hp:{first:6017,last:2060000},snakes:[
    {id:"A",path:{type:"diamondSweep",dense:true}},
    {id:"B",path:{type:"diamondSweep",mirrorX:true,dense:true}}
  ]},
  {number:24,name:"Senkrechter Wiederaufstieg",hp:{first:7220,last:2480000},snakes:[{id:"A",path:{type:"verticalReturn",dense:true}}]},
  {number:25,name:"Gegenläufige Rundkurse",hp:{first:8664,last:2990000},snakes:[
    {id:"A",path:{type:"cornerCircuit",dense:true}},
    {id:"B",path:{type:"cornerCircuit",mirrorX:true,dense:true}}
  ]},
  {number:26,name:"Diagonales Geflecht",hp:{first:10397,last:3600000},snakes:[{id:"A",path:{type:"diagonalWeave",dense:true}}]},
  {number:27,name:"Doppelte Innenspirale",hp:{first:12476,last:4340000},snakes:[{id:"A",path:{type:"rectSpiral",compact:true}}]},
  {number:28,name:"Spiegelspiralen",hp:{first:14971,last:5230000},snakes:[
    {id:"A",path:{type:"rectSpiral",compact:true}},
    {id:"B",path:{type:"rectSpiral",mirrorX:true,compact:true}}
  ]},
  {number:29,name:"Meisterliches Geflecht",hp:{first:17965,last:6300000},snakes:[{id:"A",path:{type:"diagonalWeave",dense:true,reverse:true}}]},
  {number:30,name:"Finale der Fünf",hp:{first:21558,last:7590000},fullLengthSnakes:true,snakes:[
    {id:"A",startOffset:0,path:{type:"rectSpiral",compact:true,xShift:-.04}},
    {id:"B",startOffset:-20,path:{type:"rectSpiral",mirrorX:true,compact:true,xShift:.04}},
    {id:"C",startOffset:-40,path:{type:"rectSpiral",compact:true,xShift:.02}},
    {id:"D",startOffset:-60,path:{type:"rectSpiral",mirrorX:true,compact:true,xShift:-.02}},
    {id:"E",startOffset:-80,path:{type:"rectSpiral",compact:true}}
  ]}
]);

function levelDefinition(number) {
  return LEVEL_DEFINITIONS[Math.max(0,Math.min(LEVEL_DEFINITIONS.length-1,number-1))];
}

function level1ReferenceLength(width,height,playerY=height-50) {
  const radius=26*.9,left=54,right=Math.max(left+20,width-54),rowWidth=right-left;
  const rowLength=rowWidth+Math.PI*radius;
  const dangerY=playerY-22-14*.9;
  const row=Math.max(0,Math.floor((dangerY-38)/(radius*2)));
  const rowY=38+row*radius*2;
  if(dangerY<=rowY)return row*rowLength;
  const rise=Math.min(radius*2,dangerY-rowY);
  const turnAngle=Math.acos(Math.max(-1,Math.min(1,1-rise/radius)));
  return row*rowLength+rowWidth+radius*turnAngle;
}

function rawLevelPoint(spec,t,width,height) {
  // Keep only enough margin for the scaled 44 px head sprite. The route data
  // deliberately reaches this boundary so the visible arena is used broadly.
  const edge=22,usable=Math.max(40,width-edge*2),amp=usable*(spec.amplitude??.38);
  const center=width*(spec.center??.5),phase=spec.phase||0,cycles=spec.cycles||12;
  // Every generated route starts with a short vertical lead-in. Previously the
  // high-frequency horizontal curve already ran above the screen, so a snake
  // could travel hundreds of invisible pixels before reaching y=0.
  const entrance=.035,routeT=Math.max(0,(t-entrance)/(1-entrance));
  let y=-24+(height+79)*t;
  if(["verticalReturn","diagonalCorners","rectSpiral","verticalColumns","cornerCircuit","diagonalWeave","diamondSweep"].includes(spec.type))
    return rawAdvancedLevelPoint(spec,t,width,height);
  const wave=n=>Math.sin(Math.PI*2*n*routeT+phase);
  let x=center;
  switch(spec.type){
    case "wave": x=center+amp*wave(cycles);break;
    case "sideWave": {
      const theta=Math.PI*2*cycles*routeT;
      x=center+amp*Math.sin(theta);y+=height*.20*(1-Math.cos(theta));break;
    }
    case "sideArc": {
      const theta=Math.PI*2*cycles*routeT;
      x=center+amp*(.78*Math.sin(theta+phase)+.22*Math.sin(theta*2+phase));
      y+=height*.22*(1-Math.cos(theta));break;
    }
    case "sCurve": x=center+amp*Math.tanh(1.55*Math.sin(Math.PI*2*cycles*routeT+phase))/Math.tanh(1.55);break;
    case "cross": {
      const drift=(spec.direction||1)*usable*.18*Math.sin(Math.PI*2*routeT);
      x=center+drift+amp*Math.sin(Math.PI*2*cycles*routeT+phase);break;
    }
    case "arcs": x=center+amp*Math.sin(Math.PI*2*cycles*routeT+phase-Math.sin(Math.PI*4*routeT)*.7);break;
    case "variable": {
      // Optional quadratic phase compression adds its extra turns gradually:
      // almost unchanged at the top, increasingly dense toward the bottom.
      const compressedT=routeT+(spec.bottomCompression||0)*routeT*routeT;
      const variablePhase=Math.PI*2*(cycles*compressedT+1.2*Math.sin(Math.PI*2*routeT));
      const envelope=.58+.42*(.5+.5*Math.sin(Math.PI*6*routeT+.4));
      x=center+amp*envelope*Math.sin(variablePhase+phase);break;
    }
    case "complex": x=center+amp*(.72*wave(cycles)+.20*Math.sin(Math.PI*2*(cycles/2+1)*routeT+1.1)+.08*Math.sin(Math.PI*2*routeT));break;
    case "finalWide": x=center+amp*(.78*wave(cycles)+.22*Math.sin(Math.PI*2*3*routeT+.6));break;
    case "finalTight": x=center+amp*(.70*Math.tanh(1.5*wave(cycles))/Math.tanh(1.5)+.30*Math.sin(Math.PI*2*5*routeT+phase));break;
  }
  return {x:Math.max(edge,Math.min(width-edge,x)),y};
}

function advancedRouteWaypoints(spec) {
  const routes={
    verticalReturn:[[.16,-.035],[.16,.82],[.38,.82],[.38,.10],[.62,.10],[.62,.82],[.84,.82],[.84,.16],[.28,.16],[.28,.76],[.72,.76],[.72,.28],[.48,.28],[.48,1.09]],
    verticalColumns:[[.10,-.035],[.10,.82],[.26,.82],[.26,.08],[.42,.08],[.42,.82],[.58,.82],[.58,.08],[.74,.08],[.74,.82],[.90,.82],[.90,.22],[.50,.22],[.50,1.09]],
    diagonalCorners:[[.08,-.035],[.92,.20],[.08,.39],[.92,.58],[.08,.76],[.92,.82],[.18,.66],[.82,.45],[.18,.25],[.82,.12],[.50,.50],[.10,.80],[.50,1.09]],
    diagonalWeave:[[.06,-.035],[.94,.18],[.06,.34],[.94,.50],[.06,.66],[.94,.80],[.12,.82],[.88,.70],[.12,.54],[.88,.38],[.12,.22],[.88,.08],[.50,.56],[.50,1.09]],
    diamondSweep:[[.50,-.035],[.94,.18],[.50,.38],[.06,.18],[.50,.04],[.90,.50],[.50,.72],[.10,.50],[.50,.30],[.86,.78],[.50,.82],[.14,.78],[.50,.58],[.50,1.09]],
    cornerCircuit:[[.08,-.035],[.08,.18],[.92,.18],[.92,.80],[.08,.80],[.08,.30],[.80,.30],[.80,.70],[.20,.70],[.20,.42],[.68,.42],[.68,.60],[.32,.60],[.32,.50],[.50,.50],[.50,1.09]],
    rectSpiral:[[.92,-.035],[.92,.82],[.08,.82],[.08,.10],[.84,.10],[.84,.78],[.16,.78],[.16,.18],[.76,.18],[.76,.72],[.24,.72],[.24,.26],[.68,.26],[.68,.66],[.32,.66],[.32,.34],[.60,.34],[.60,.58],[.40,.58],[.40,.42],[.54,.42],[.54,.52],[.50,.52],[.50,1.09]]
  };
  let points=routes[spec.type]||routes.diagonalWeave;
  if(spec.dense)points=[...points.slice(0,-1),...points.slice(1,-1).reverse(),points.at(-1)];
  if(spec.compact&&spec.type==="rectSpiral")points=[...points.slice(0,-1),[.46,.48],[.56,.48],[.50,.56],points.at(-1)];
  if(spec.reverse)points=[points[0],...points.slice(1,-1).reverse(),points.at(-1)];
  // Keep the first visible movement vertical so diagonal routes cannot spend
  // a long distance travelling sideways above the screen.
  points=[points[0],[points[0][0],0],...points.slice(1)];
  return points.map(([x,y])=>[
    Math.max(.03,Math.min(.97,(spec.mirrorX?1-x:x)+(spec.xShift||0))),y
  ]);
}

function rawAdvancedLevelPoint(spec,t,width,height) {
  const edge=22,usable=Math.max(40,width-edge*2),points=advancedRouteWaypoints(spec);
  const scaled=t*(points.length-1),index=Math.min(points.length-2,Math.floor(scaled)),local=scaled-index;
  // Smoothstep keeps the coordinated turns readable without overshooting the arena.
  const eased=local*local*(3-2*local),a=points[index],b=points[index+1];
  return {x:edge+usable*(a[0]+(b[0]-a[0])*eased),y:height*(a[1]+(b[1]-a[1])*eased)};
}

function samplePath(spec,width,height,samples=3200) {
  const points=[],distances=[0];let length=0,previous=null;
  for(let i=0;i<=samples;i++){
    const point=rawLevelPoint(spec,i/samples,width,height);
    if(previous)length+=Math.hypot(point.x-previous.x,point.y-previous.y);
    points.push(point);distances.push(length);previous=point;
  }
  distances.shift();
  return {spec,points,distances,length,width,height};
}

function pointOnSampledPath(path,distance) {
  const {points,distances}=path;
  if(distance<=0){
    const a=points[0],b=points[1],angle=Math.atan2(b.y-a.y,b.x-a.x);
    return {x:a.x+Math.cos(angle)*distance,y:a.y+Math.sin(angle)*distance,angle};
  }
  if(distance>=path.length){
    const a=points.at(-2),b=points.at(-1),angle=Math.atan2(b.y-a.y,b.x-a.x),extra=distance-path.length;
    return {x:b.x+Math.cos(angle)*extra,y:b.y+Math.sin(angle)*extra,angle};
  }
  let lo=0,hi=distances.length-1;
  while(lo+1<hi){const mid=(lo+hi)>>1;if(distances[mid]<distance)lo=mid;else hi=mid;}
  const a=points[lo],b=points[hi],span=distances[hi]-distances[lo]||1,t=(distance-distances[lo])/span;
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)};
}

function buildLevelPath(spec,width,height,minimumLength) {
  if(spec.type==="level1")return {spec,length:minimumLength,width,height,level1:true};
  const path=samplePath(spec,width,height);
  if(path.length+1e-6<minimumLength)
    throw new Error(`Levelpfad ${spec.type} ist mit ${path.length.toFixed(1)}px kürzer als Level 1 (${minimumLength.toFixed(1)}px).`);
  return path;
}
