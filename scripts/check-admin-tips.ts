import assert from "node:assert/strict";
import { tipsRange, tipsInputSchema, tipsDay, defaultTipsDates, tipsCsv, tipsCsvCell, positiveTipCents } from "../shared/adminTips";
import { appRouter } from "../server/routers";

let checks = 0;
const check = (run: () => void) => { run(); checks++; };
check(() => assert.equal(tipsRange({ from: "2026-03-08", to: "2026-03-08" }).end.getTime() - tipsRange({ from: "2026-03-08", to: "2026-03-08" }).start.getTime(), 23 * 3_600_000));
check(() => assert.equal(tipsRange({ from: "2026-11-01", to: "2026-11-01" }).end.getTime() - tipsRange({ from: "2026-11-01", to: "2026-11-01" }).start.getTime(), 25 * 3_600_000));
check(() => assert.equal(tipsRange({ from: "2026-10-16", to: "2026-10-16" }).start.toISOString(), "2026-10-16T04:00:00.000Z"));
check(() => assert.equal(tipsRange({ from: "2099-12-31", to: "2099-12-31" }).end.toISOString(), "2100-01-01T05:00:00.000Z"));
for (const input of [
  { from: "2026-02-30", to: "2026-03-01" }, { from: "2026-2-01", to: "2026-03-01" },
  { from: "2026-03-02", to: "2026-03-01" }, { from: "2025-01-01", to: "2026-01-02" },
]) check(() => assert.equal(tipsInputSchema.safeParse(input).success, false));
check(() => assert.equal(tipsInputSchema.safeParse({ from: "2024-01-01", to: "2024-12-31" }).success, true));
check(() => assert.equal(tipsInputSchema.safeParse({ from: "2024-01-01", to: "2024-12-31", page: 0 }).success, false));
check(() => assert.deepEqual(defaultTipsDates(new Date("2026-11-01T03:00:00Z")), { from: "2026-10-01", to: "2026-10-31" }));
check(() => assert.equal(tipsDay(new Date("2026-03-09T03:59:59Z")), "2026-03-08"));
for (const value of ["=formula", " +SUM(1)", "\t@cmd", "\n-1"]) check(() => assert.equal(tipsCsvCell(value).startsWith('"\''), true));
check(() => assert.equal(tipsCsvCell('plain,"quoted"'), '"plain,""quoted"""'));
check(() => assert.equal(positiveTipCents("0.01", "dollars"), 1));
check(() => assert.equal(positiveTipCents("5.25", "dollars"), 525));
for (const value of [0, -1, NaN, Infinity, 1.5, " 1", "=1"]) check(() => assert.equal(positiveTipCents(value), null));
const row = { id: 1, orderNumber: "=DANGER", createdAt: new Date("2026-10-16T04:00:00Z"), tipCents: 325 };
check(() => assert.equal(tipsCsv([row]).includes('"\'=DANGER","2026-10-16","3.25","paid"'), true));
check(() => assert.equal(tipsCsv(Array.from({ length: 10_000 }, () => row)).split("\r\n").length, 10_001));
check(() => assert.throws(() => tipsCsv(Array.from({ length: 10_001 }, () => row)), /10,000/));
async function checkAuthorization() {
const anonymous = appRouter.createCaller({ admin: null, req: {}, res: {} } as never);
await assert.rejects(anonymous.tips.report({ from: "2026-10-01", to: "2026-10-16" }), error => (error as { code: string }).code === "UNAUTHORIZED"); checks++;
await assert.rejects(anonymous.tips.export({ from: "2026-10-01", to: "2026-10-16" }), error => (error as { code: string }).code === "UNAUTHORIZED"); checks++;
console.info(`${checks} admin tips date, DST, cent, CSV and authorization checks passed.`);
}
checkAuthorization().catch(error => { console.error(error); process.exitCode = 1; });
