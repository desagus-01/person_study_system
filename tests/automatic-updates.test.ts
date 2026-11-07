/** Fork package identity and hard-disabled updater contract. No Electron,
 * network, profile, or updater operation is run. */
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { describe, it } from "node:test";

const mainFile = fileURLToPath(new URL("../electron/main.cjs", import.meta.url));
const mainSource = readFileSync(mainFile, "utf8");
const mainRequire = createRequire(mainFile);

function fixture() {
	const names: string[] = [];
	let updaterLoads = 0;
	class FakeWindow extends EventEmitter {
		webContents = { send() {}, getZoomFactor: () => 1, setZoomFactor() {} };
		static getAllWindows() { return []; }
		static fromWebContents() { return undefined; }
	}
	const app = Object.assign(new EventEmitter(), {
		isPackaged: true,
		setName: (name: string) => names.push(name),
		getPath: () => "/fixture/person-study-system",
		setPath() {},
		requestSingleInstanceLock: () => false,
		quit() {},
		whenReady: async () => {},
	});
	const context = createContext({
		require: (id: string) => {
			if (id === "electron") return {
				app,
				BrowserWindow: FakeWindow,
				Menu: { buildFromTemplate: (value: unknown) => value, setApplicationMenu() {} },
				ipcMain: { on() {}, handle() {} },
				session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {} } },
				shell: { openExternal() {} },
			};
			if (id === "electron-updater") {
				updaterLoads++;
				throw new Error("the updater must not load");
			}
			return mainRequire(id);
		},
		process: { argv: [], env: { LH_DEV_URL: "http://127.0.0.1:9000", LH_UPDATE_FEED: "https://upstream.invalid" }, platform: "darwin", on() {} },
		__dirname: path.dirname(mainFile),
		URL,
		setInterval() {},
		setTimeout() {},
	});
	runInContext(mainSource, context, { filename: mainFile });
	return {
		names,
		updaterLoads: () => updaterLoads,
		state: () => JSON.parse(JSON.stringify(runInContext("updateState", context))),
		setup: () => runInContext("setupAutoUpdater()", context),
	};
}

describe("fork identity and updates", () => {
	it("sets a separate Electron app name before it selects a user-data path", () => {
		const f = fixture();
		assert.deepEqual(f.names, ["Person Study System"]);
	});

	it("reports updates unavailable in packaged mode without loading an updater or honoring a feed override", () => {
		const f = fixture();
		f.setup();
		assert.deepEqual(f.state(), { status: "disabled", version: null, revision: 1 });
		assert.equal(f.updaterLoads(), 0);
	});

	it("uses local package identifiers and declares no electron-builder publish target", () => {
		const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
		const builder = readFileSync(new URL("../electron-builder.yml", import.meta.url), "utf8");
		assert.equal(packageJson.name, "person-study-system");
		assert.equal(packageJson.desktopName, "person-study-system.desktop");
		assert.match(builder, /^appId: local\.person-study-system$/m);
		assert.match(builder, /^productName: Person Study System$/m);
		assert.doesNotMatch(builder, /^publish:/m);
		assert.doesNotMatch(builder, /node_modules\/electron-updater\/\*\*\/\*/);
		assert.doesNotMatch(builder, /amosblomqvist\s*\n\s*repo: learnharness/);
	});
});
