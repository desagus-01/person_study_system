/**
 * SQLite driver compatibility gate for Stage 1 (S1-CT2).
 *
 * Verifies better-sqlite3 can:
 * - load native bindings,
 * - open a database,
 * - enable foreign keys + WAL,
 * - execute a minimal write/read transaction,
 * in both host Node and Electron's bundled Node runtime.
 *
 * Usage:
 *   node scripts/smoke-sqlite-runtime.mjs
 *   node scripts/smoke-sqlite-runtime.mjs --runtime /path/to/node-or-electron
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

function probeEnv(baseEnv, home) {
	return {
		PATH: baseEnv.PATH,
		HOME: home,
		TMPDIR: home,
		XDG_CONFIG_HOME: path.join(home, ".config"),
		XDG_CACHE_HOME: path.join(home, ".cache"),
		XDG_DATA_HOME: path.join(home, ".local", "share"),
		NODE_ENV: "test",
	};
}

function formatOutput(result) {
	return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

function runProbeWithRuntime(runtime) {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "lh-sqlite-gate-"));
	try {
		const result = spawnSync(runtime, [fileURLToPath(import.meta.url), "--probe"], {
			cwd: process.cwd(),
			env: {
				...probeEnv(process.env, home),
				ELECTRON_RUN_AS_NODE: "1",
			},
			encoding: "utf8",
			timeout: 30_000,
			maxBuffer: 128 * 1024,
		});
		if (result.error || result.status !== 0) {
			throw new Error(`sqlite runtime probe failed (${result.error?.message ?? result.status}):\n${formatOutput(result)}`);
		}
		assert.match(result.stdout, /sqlite runtime probe passed/, "probe exited without success marker");
		process.stdout.write(result.stdout);
	} finally {
		fs.rmSync(home, { recursive: true, force: true });
	}
}

function runProbe() {
	const BetterSqlite3 = require("better-sqlite3");
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-sqlite-db-"));
	const dbPath = path.join(tempDir, "probe.db");
	const db = new BetterSqlite3(dbPath);
	try {
		db.pragma("foreign_keys = ON");
		db.pragma("journal_mode = WAL");
		db.exec(`
			CREATE TABLE goals (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL
			);
			CREATE TABLE targets (
				id TEXT PRIMARY KEY,
				goal_id TEXT NOT NULL REFERENCES goals(id),
				text TEXT NOT NULL
			);
		`);
		const tx = db.transaction(() => {
			db.prepare("INSERT INTO goals (id, title) VALUES (?, ?)").run("goal_1", "Foundations");
			db.prepare("INSERT INTO targets (id, goal_id, text) VALUES (?, ?, ?)").run("target_1", "goal_1", "Explain derivatives");
		});
		tx();

		const row = db.prepare("SELECT t.id, t.goal_id, t.text, g.title FROM targets t JOIN goals g ON g.id = t.goal_id WHERE t.id = ?").get("target_1");
		assert.equal(row.id, "target_1");
		assert.equal(row.goal_id, "goal_1");
		assert.equal(row.title, "Foundations");

		const mode = db.pragma("journal_mode", { simple: true });
		assert.equal(String(mode).toLowerCase(), "wal");

		console.log(`[smoke-sqlite-runtime] sqlite runtime probe passed (${process.execPath})`);
	} finally {
		db.close();
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function resolveElectronBinary() {
	try {
		return require("electron");
	} catch {
		return null;
	}
}

function main() {
	const args = process.argv.slice(2);
	if (args[0] === "--probe") {
		runProbe();
		return;
	}
	const runtimeIndex = args.indexOf("--runtime");
	if (runtimeIndex >= 0) {
		const runtime = args[runtimeIndex + 1];
		if (!runtime || runtime.startsWith("--")) throw new Error("--runtime requires a binary path");
		runProbeWithRuntime(path.resolve(runtime));
		return;
	}

	runProbeWithRuntime(process.execPath);
	const electron = resolveElectronBinary();
	if (!electron) {
		console.log("[smoke-sqlite-runtime] electron binary not available; skipped Electron runtime probe");
		return;
	}
	runProbeWithRuntime(electron);
}

try {
	main();
} catch (error) {
	console.error(`[smoke-sqlite-runtime] FAIL: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
