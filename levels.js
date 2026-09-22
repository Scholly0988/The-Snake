"use strict";

// Data-only campaign setup. Level 1 deliberately keeps the original path in game.js.
const LEVEL_DEFINITIONS = Object.freeze([
  {number:1,name:"Referenzpfad",hp:{first:5,last:5500},snakes:[{id:"A",path:{type:"level1"}}]},
  {number:2,name:"Große Wellen",hp:{first:15,last:9000},snakes:[{id:"A",path:{type:"wave",cycles:10,amplitude:.39,phase:-.25}}]},
  {number:3,name:"Getrennte Seiten",hp:{first:32,last:14500},snakes:[
    {id:"A",side:"left",path:{type:"sideWave",cycles:9,amplitude:.18,center:.27,phase:0}},
    {id:"B",side:"right",path:{type:"sideArc",cycles:8,amplitude:.19,center:.73,phase:Math.PI}}
  ]},
  {number:4,name:"S-Kurven",hp:{first:50,last:22000},snakes:[{id:"A",path:{type:"sCurve",cycles:14,amplitude:.40,phase:0}}]},
  {number:5,name:"Kreuzende Wege",hp:{first:75,last:32000},snakes:[
    {id:"A",path:{type:"cross",cycles:14,amplitude:.30,phase:0,direction:1}},
    {id:"B",path:{type:"cross",cycles:14,amplitude:.30,phase:Math.PI,direction:-1}}
  ]},
  {number:6,name:"Große Bögen",hp:{first:110,last:45000},snakes:[{id:"A",path:{type:"arcs",cycles:12,amplitude:.41,phase:0}}]},
  {number:7,name:"Wechselnde Kurvenradien",hp:{first:160,last:62000},snakes:[{id:"A",path:{type:"variable",cycles:13,amplitude:.40,phase:0}}]},
  {number:8,name:"Geteilte Muster",hp:{first:230,last:82000},snakes:[
    {id:"A",path:{type:"wave",cycles:10,amplitude:.38,phase:0}},
    {id:"B",path:{type:"sCurve",cycles:15,amplitude:.35,phase:Math.PI}}
  ]},
  {number:9,name:"Komplexer Rundkurs",hp:{first:320,last:108000},snakes:[{id:"A",path:{type:"complex",cycles:14,amplitude:.40,phase:0}}]},
  {number:10,name:"Finales Doppel",hp:{first:450,last:140000},snakes:[
    {id:"A",path:{type:"finalWide",cycles:13,amplitude:.39,phase:0}},
    {id:"B",path:{type:"finalTight",cycles:16,amplitude:.35,phase:Math.PI}}
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
  const edge=40,usable=Math.max(40,width-edge*2),amp=usable*(spec.amplitude??.38);
  const center=width*(spec.center??.5),phase=spec.phase||0,cycles=spec.cycles||12;
  let y=-70+(height+125)*t;
  const wave=n=>Math.sin(Math.PI*2*n*t+phase);
  let x=center;
  switch(spec.type){
    case "wave": x=center+amp*wave(cycles);break;
    case "sideWave": {
      const theta=Math.PI*2*cycles*t;
      x=center+amp*Math.sin(theta);y+=height*.20*(1-Math.cos(theta));break;
    }
    case "sideArc": {
      const theta=Math.PI*2*cycles*t;
      x=center+amp*(.78*Math.sin(theta+phase)+.22*Math.sin(theta*2+phase));
      y+=height*.22*(1-Math.cos(theta));break;
    }
    case "sCurve": x=center+amp*Math.tanh(1.55*Math.sin(Math.PI*2*cycles*t+phase))/Math.tanh(1.55);break;
    case "cross": {
      const drift=(spec.direction||1)*usable*.18*Math.sin(Math.PI*2*t);
      x=center+drift+amp*Math.sin(Math.PI*2*cycles*t+phase);break;
    }
    case "arcs": x=center+amp*Math.sin(Math.PI*2*cycles*t+phase-Math.sin(Math.PI*4*t)*.7);break;
    case "variable": {
      const variablePhase=Math.PI*2*(cycles*t+1.2*Math.sin(Math.PI*2*t));
      const envelope=.58+.42*(.5+.5*Math.sin(Math.PI*6*t+.4));
      x=center+amp*envelope*Math.sin(variablePhase+phase);break;
    }
    case "complex": x=center+amp*(.72*wave(cycles)+.20*Math.sin(Math.PI*2*(cycles/2+1)*t+1.1)+.08*Math.sin(Math.PI*2*t));break;
    case "finalWide": x=center+amp*(.78*wave(cycles)+.22*Math.sin(Math.PI*2*3*t+.6));break;
    case "finalTight": x=center+amp*(.70*Math.tanh(1.5*wave(cycles))/Math.tanh(1.5)+.30*Math.sin(Math.PI*2*5*t+phase));break;
  }
  return {x:Math.max(edge,Math.min(width-edge,x)),y};
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
