import type {Inventory} from './scanner.ts';
import {inventoryDiff} from './inventory-diff.ts';
/** A parsed comparison is valid only against the inventory it was compared with. */
export function comparisonFingerprint(i:Inventory):string{return JSON.stringify(i)}
export function verifiedComparison(reference:Inventory|null,current:Inventory,comparedAgainst:string):ReturnType<typeof inventoryDiff>|null{
 if(!reference||comparedAgainst!==comparisonFingerprint(current))return null;
 return inventoryDiff(reference,current);
}
