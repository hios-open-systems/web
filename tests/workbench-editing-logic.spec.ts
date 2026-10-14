import { expect, test } from '@playwright/test';
import { parseCron, nextRuns } from '../lib/workbench/cron';
import { hexToRgb } from '../lib/workbench/color';

test('cron validates complete fields and standard day matching', () => {
  for(const value of ['*/0 * * * *','1-99999 * * * *','12x * * * *','0 0 0 * *','* * * * 8','* * * * * *'])
    expect(parseCron(value).valid).toBe(false);
  expect(parseCron('5/15 * * * *').fields?.minute).toEqual([5,20,35,50]);
  expect(parseCron('0 0 * * 7').fields?.dayOfWeek).toEqual([0]);
  const runs=nextRuns(parseCron('0 9 1 * 1'),3,new Date(2026,0,2,0,0));
  expect(runs.map(d=>d.getDate())).toEqual([5,12,19]);
  expect(nextRuns(parseCron('0 0 31 2 *'),8,new Date(2026,0,1))).toEqual([]);
});
test('HEX accepts only supported lengths and expands shorthand correctly',()=>{
  expect(hexToRgb('#abc')).toEqual({r:170,g:187,b:204});
  expect(hexToRgb(' #ABCDEF ')).toEqual({r:171,g:205,b:239});
  for(const value of ['#abcd','#12345','#1234567','#12345678','##abc'])expect(hexToRgb(value)).toBeNull();
});
