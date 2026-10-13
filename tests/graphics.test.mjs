import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

const sourceRoot = new URL("../src/images/", import.meta.url);
const optimizedRoot = new URL("../src/optimized/", import.meta.url);
const report = JSON.parse(await readFile(new URL("report.json", optimizedRoot), "utf8"));

test("optimized artwork decodes, reduces download size, and preserves scene geometry", async () => {
  assert.ok(report.length > 0);
  for (const entry of report) {
    const original = new URL(entry.source, sourceRoot);
    const output = new URL(entry.output, optimizedRoot);
    const source = await sharp(await readFile(original)).metadata();
    const optimized = await sharp(await readFile(output)).metadata();
    assert.equal(optimized.format, "webp", entry.output);
    assert.ok((await stat(output)).size < (await stat(original)).size, entry.output);
    assert.equal(optimized.width, entry.width);
    assert.equal(optimized.height, entry.height);
    assert.equal(optimized.hasAlpha, source.hasAlpha, entry.output);
    assert.ok(Math.abs(optimized.height - source.height * optimized.width / source.width) <= 1,
      `${entry.output}: aspect ratio`);
    if (entry.source.startsWith("scenes/")) {
      assert.equal(optimized.width, source.width);
      assert.equal(optimized.height, source.height);
    }
  }
});

test("transparent artwork retains its alpha outline, and lossless sprites retain visible pixels", async () => {
  for (const entry of report) {
    const input = await readFile(new URL(entry.source, sourceRoot));
    if (!(await sharp(input).metadata()).hasAlpha) continue;
    const output = await readFile(new URL(entry.output, optimizedRoot));
    const resized = await sharp(input).resize({ width: entry.width, withoutEnlargement: true }).png().toBuffer();
    const expectedAlpha = await sharp(resized).extractChannel("alpha").raw().toBuffer();
    const actualAlpha = await sharp(output).extractChannel("alpha").raw().toBuffer();
    assert.ok(expectedAlpha.equals(actualAlpha), `${entry.output}: alpha outline`);
    if (entry.lossless) {
      // RGB under fully transparent pixels is invisible and may be discarded.
      for (const background of ["#000", "#fff"]) {
        const expected = await sharp(resized).flatten({ background }).raw().toBuffer();
        const actual = await sharp(output).flatten({ background }).raw().toBuffer();
        assert.ok(expected.equals(actual), `${entry.output}: visible pixels on ${background}`);
      }
    }
  }
});
