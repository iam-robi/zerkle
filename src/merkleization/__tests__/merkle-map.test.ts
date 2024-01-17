import { test } from "uvu";
import * as assert from "uvu/assert";
import { MerkleMap } from "../merkle-map.js";
import { Field } from "o1js";
import { MINA_OPS } from "../../mina-backend.js";

test("set and get a value from a key", () => {
  const map = new MerkleMap(MINA_OPS);

  const key = Field.random();
  const value = Field.random();

  map.set(key, value);

  assert.ok(map.get(key).equals(value).toBoolean());

  const witness = map.witness(key);
});

test.run();
