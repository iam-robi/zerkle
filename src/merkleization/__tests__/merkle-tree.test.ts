import { test } from "uvu";
import * as assert from "uvu/assert";
import { MerkleTree } from "../merkle-tree.js";
import { Field } from "o1js";
import { MINA_OPS } from "../../mina-backend.js";

function validate(tree: MerkleTree<Field>, index: bigint): boolean {
  const path = tree.witness(index);
  let hash = tree.get(index);
  for (const node of path) {
    hash = node.isLeft ? MINA_OPS.hash(hash, node.sibling) : MINA_OPS.hash(node.sibling, hash);
  }

  return MINA_OPS.equal(hash, tree.root);
}

test("root of empty tree of size 1", () => {
  const tree = new MerkleTree(MINA_OPS, 1);
  assert.equal(tree.root, Field(0));
});

test("root is correct", () => {
  const tree = new MerkleTree(MINA_OPS, 2);
  tree.set(0n, Field(1));
  tree.set(1n, Field(2));
  assert.equal(tree.root, MINA_OPS.hash(Field(1), Field(2)));
});

test("builds correct tree", () => {
  const tree = new MerkleTree(MINA_OPS, 4);
  tree.set(0n, Field(1));
  tree.set(1n, Field(2));
  tree.set(2n, Field(3));
  assert.ok(validate(tree, 0n));
  assert.ok(validate(tree, 1n));
  assert.ok(validate(tree, 2n));
  assert.ok(validate(tree, 3n));
});

test("tree of height 128", () => {
  const tree = new MerkleTree(MINA_OPS, 128);

  const index = 2n ** 64n;
  assert.ok(validate(tree, index));

  tree.set(index, Field(1));
  assert.ok(validate(tree, index));
});

test("tree of height 256", () => {
  const tree = new MerkleTree(MINA_OPS, 256);

  const index = 2n ** 128n;
  assert.ok(validate(tree, index));
  tree.set(index, Field(1));
  assert.ok(validate(tree, index));
});

// it("works with MerkleWitness", () => {
//   // tree with height 3 (4 leaves)
//   const HEIGHT = 3;
//   let tree = new MerkleTree(HEIGHT);
//   class MyMerkleWitness extends MerkleWitness(HEIGHT) {}
//
//   // tree with the leaves [15, 16, 17, 18]
//   tree.fill([15, 16, 17, 18].map(Field));
//
//   // witness for the leaf '17', at index 2
//   let witness = new MyMerkleWitness(tree.getWitness(2n));
//
//   // calculate index
//   expect(witness.calculateIndex().toString()).toEqual("2");
//
//   // calculate root
//   let root = witness.calculateRoot(Field(17));
//   expect(tree.getRoot()).toEqual(root);
//
//   root = witness.calculateRoot(Field(16));
//   expect(tree.getRoot()).not.toEqual(root);
//
//   // construct and check path manually
//   let leftHalfHash = Poseidon.hash([Field(15), Field(16)]).toString();
//   let expectedWitness = {
//     path: ["18", leftHalfHash],
//     isLeft: [true, false],
//   };
//   expect(witness.toJSON()).toEqual(expectedWitness);
// });

test.run();
