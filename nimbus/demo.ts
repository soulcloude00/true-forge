import {fixture} from './fixture.ts';
import {scan} from './scanner.ts';
console.log(JSON.stringify({source:'SYNTHETIC FIXTURE - NOT A REAL AWS ACCOUNT',findings:scan(fixture)},null,2));
