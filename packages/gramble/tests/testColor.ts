import { expect } from 'chai';
import { Tier, parseTier } from '../src/tierParser';
import { meanAngleDeg } from '../src/util';

var a = (meanAngleDeg([200, 300]) + 360) % 360;
console.log(a);

var t = parseTier("gloss", { sheet: '', row: -1, col: -1 });

console.log(t.hue);
console.log(t.getColor());


t = parseTier("mood/gloss", { sheet: '', row: -1, col: -1 });

console.log(t.hue);
console.log(t.getColor());


t = parseTier("subject", { sheet: '', row: -1, col: -1 });

console.log(t.hue);
console.log(t.getColor());

t = parseTier("subject/gloss", { sheet: '', row: -1, col: -1 });

console.log(t.hue);
console.log(t.getColor());