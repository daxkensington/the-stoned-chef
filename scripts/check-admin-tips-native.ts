// Real PostgreSQL regression in an owned, unexposed, network-disabled container.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { drizzle } from "drizzle-orm/pg-proxy";
import { getAdminTipsReport, exportAdminTips } from "../server/adminTips";
import { tipsRange } from "../shared/adminTips";

async function main() {
  if (process.env.DATABASE_URL) throw new Error("Native tips checks refuse inherited DATABASE_URL.");
  const owner = randomUUID();
  const container = `chef-tips-test-${owner}`;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8", timeout: 120_000, maxBuffer: 20 * 1024 * 1024 }).trim();
  let created = false;
  try {
    docker("run", "--detach", "--name", container, "--label", `codex.tips.owner=${owner}`, "--network", "none", "--env", "POSTGRES_HOST_AUTH_METHOD=trust", "--env", "POSTGRES_DB=chef_tips_test", "postgres:16"); created = true;
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try { docker("exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres", "-d", "chef_tips_test"); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 250)); }
    }
    if (!ready) throw new Error("Owned PostgreSQL did not become ready.");
    const psql = (statement: string) => docker("exec", "--env", "PGTZ=Pacific/Honolulu", container, "psql", "-X", "-h", "127.0.0.1", "-U", "postgres", "-d", "chef_tips_test", "-v", "ON_ERROR_STOP=1", "-A", "-t", "-c", statement);
    psql("CREATE TABLE orders (id SERIAL PRIMARY KEY, order_number VARCHAR(64) NOT NULL, created_at TIMESTAMPTZ NOT NULL, tip_cents INTEGER NOT NULL, payment_status TEXT NOT NULL, status TEXT NOT NULL)");
    const literal = (value: unknown): string => {
      if (value === null) return "NULL";
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
      if (typeof value === "string") return `'${value.replaceAll("'", "''")}'`;
      throw new Error("Unexpected synthetic SQL parameter.");
    };
    let reportQueries = 0;
    const database = drizzle(async (statement, params) => {
      reportQueries++;
      assert.match(statement, /^select /i);
      const bound = statement.replace(/\$(\d+)/g, (_, index) => literal(params[Number(index) - 1]));
      const rows = JSON.parse(psql(`SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (${bound}) t`)) as Record<string, unknown>[];
      return { rows: rows.map(row => Object.values(row)) };
    });
    const input = { from: "2026-03-08", to: "2026-03-08", page: 1 };
    const range = tipsRange(input);
    psql(`INSERT INTO orders (id,order_number,created_at,tip_cents,payment_status,status) SELECT n,'SYNTHETIC-'||n,'${range.start.toISOString()}',125,'paid','preparing' FROM generate_series(1,60) n`);
    const variants = [
      [61, range.end.getTime() - 1000, 250, "paid", "completed"],
      [62, range.start.getTime() - 1000, 300, "paid", "preparing"],
      [63, range.end.getTime(), 400, "paid", "preparing"],
      [64, range.start.getTime(), 500, "unpaid", "preparing"],
      [65, range.start.getTime(), 500, "refunded", "preparing"],
      [66, range.start.getTime(), 500, "paid", "cancelled"],
      [67, range.start.getTime(), 0, "paid", "preparing"],
      [68, range.start.getTime(), -1, "paid", "preparing"],
      [69, range.start.getTime(), 500, "failed", "preparing"],
    ];
    psql(`INSERT INTO orders (id,order_number,created_at,tip_cents,payment_status,status) VALUES ${variants.map(([id, date, cents, payment, status]) => `(${id},'SYNTHETIC-${id}','${new Date(Number(date)).toISOString()}',${cents},'${payment}','${status}')`).join(",")}`);
    const report = await getAdminTipsReport(input, database as never);
    assert.equal(reportQueries, 1, "Report summary, dates and rows must share one SQL snapshot"); assert.equal(report.totalTipCents, 7750); assert.equal(report.tippedOrders, 61); assert.equal(report.averageTipCents, 127);
    assert.equal(report.pageCount, 3); assert.equal(report.rows.length, 25);
    assert.deepEqual(report.daily, [{ date: "2026-03-08", tipCents: 7750, orders: 61 }]);
    assert.equal(report.rows[0].id, 61); assert.equal(report.rows[1].id, 60); assert.deepEqual(report.rows[1].createdAt, range.start);
    const second = await getAdminTipsReport({ ...input, page: 2 }, database as never);
    assert.equal(second.totalTipCents, 7750); assert.equal(second.rows.length, 25);
    assert.equal(new Set([...report.rows, ...second.rows].map(row => row.id)).size, 50);
    psql("UPDATE orders SET order_number = '=FORMULA' WHERE id = 1");
    const exported = await exportAdminTips(input, database as never);
    assert.equal(exported.csv.split("\r\n").length, 62); assert.ok(exported.csv.includes('"\'=FORMULA"')); assert.ok(!exported.csv.includes("SYNTHETIC-62"));
    psql(`INSERT INTO orders (id,order_number,created_at,tip_cents,payment_status,status) SELECT n,'OVERFLOW-'||n,'${range.start.toISOString()}',1,'paid','completed' FROM generate_series(100,10100) n`);
    await assert.rejects(exportAdminTips(input, database as never), /10,000/);
    const unsafeAggregate = drizzle(async () => ({ rows: [["9007199254740993", 1, [], []]] }));
    await assert.rejects(getAdminTipsReport(input, unsafeAggregate as never), /precision/);
    const unsafeOrder = drizzle(async () => ({ rows: [[125, 1, [], [{ id: 1, orderNumber: "SYNTHETIC", createdAt: range.start.toISOString(), tipCents: "9007199254740993" }]]] }));
    await assert.rejects(getAdminTipsReport(input, unsafeOrder as never), /precision/);
    console.info("Native PostgreSQL tips checks passed: one-statement snapshot, unsafe precision rejection, eligibility, Toronto boundaries, paging, CSV and overflow refusal.");
  } finally {
    if (created) {
      const recordedOwner = docker("inspect", "--format", '{{index .Config.Labels "codex.tips.owner"}}', container);
      if (recordedOwner !== owner) throw new Error("Refusing cleanup: owned PostgreSQL label changed.");
      docker("rm", "--force", "--volumes", container);
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
