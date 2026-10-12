import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../pwa/service-worker.js", import.meta.url), "utf8");

function worker({ online = true, status = 200, failInstall = false } = {}) {
  const listeners = {};
  const responses = new Map([["/", new Response("offline game")],
    ["/_next/static/game.js", new Response("cached game code")]]);
  const deleted = [];
  const installed = [];
  let claimed = false;
  let networkCalls = 0;
  class WorkerRequest extends Request {
    constructor(url, options) {
      super(new URL(url, "https://pirates.test"), options);
    }
  }
  vm.runInNewContext(source, {
    __PIRATES_BUILD__: { cacheName: "pirates-current", precacheUrls: ["/", "/_next/static/game.js"] },
    Request: WorkerRequest, URL, Set, Promise,
    self: {
      location: { origin: "https://pirates.test" },
      clients: { claim: async () => { claimed = true; } },
      addEventListener: (type, listener) => { listeners[type] = listener; },
    },
    caches: {
      open: async () => ({
        addAll: async (requests) => {
          if (failInstall) throw new Error("offline during install");
          installed.push(...requests);
        },
        match: async (request) => responses.get(typeof request === "string"
          ? request : new URL(request.url).pathname)?.clone(),
      }),
      keys: async () => ["pirates-current", "pirates-old", "another-app"],
      delete: async (key) => { deleted.push(key); return true; },
    },
    fetch: async () => {
      networkCalls += 1;
      if (!online) throw new TypeError("offline");
      return new Response("online game", { status });
    },
  });
  return {
    installed, deleted,
    get claimed() { return claimed; },
    get networkCalls() { return networkCalls; },
    lifecycle(type) {
      let promise;
      listeners[type]({ waitUntil: (value) => { promise = value; } });
      return promise;
    },
    fetch(path, { mode = "navigate", method = "GET" } = {}) {
      let promise;
      listeners.fetch({
        request: { url: `https://pirates.test${path}`, mode, method },
        respondWith: (value) => { promise = value; },
      });
      return promise;
    },
  };
}

test("worker installs the full asset set and only deletes old Pirates caches", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  assert.equal(sw.installed.length, 2);
  assert.ok(sw.installed.every((request) => request.cache === "reload"));
  await sw.lifecycle("activate");
  assert.deepEqual(sw.deleted, ["pirates-old"]);
  assert.equal(sw.claimed, true);
});

test("failed precaching rejects installation instead of activating an incomplete game", async () => {
  await assert.rejects(worker({ failInstall: true }).lifecycle("install"), /offline during install/);
});

test("root launches online and falls back to the cached game offline or on server error", async () => {
  assert.equal(await (await worker().fetch("/")).text(), "online game");
  assert.equal(await (await worker({ online: false }).fetch("/?from=home")).text(), "offline game");
  assert.equal(await (await worker({ status: 503 }).fetch("/")).text(), "offline game");
});

test("bundled code is available offline without replacing RSC, other routes, or writes", async () => {
  const sw = worker({ online: false });
  assert.equal(await (await sw.fetch("/_next/static/game.js", { mode: "cors" })).text(), "cached game code");
  assert.equal(sw.networkCalls, 0);
  assert.equal(sw.fetch("/?_rsc=payload", { mode: "cors" }), undefined);
  assert.equal(sw.fetch("/unknown"), undefined);
  assert.equal(sw.fetch("/", { method: "POST" }), undefined);
});
