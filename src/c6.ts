import { MerkleMapFactory, Verification, Backend, Query, IPLD } from "./index.js";

async function main() {
  // Private
  const map = MerkleMapFactory.fromLinearModel(
    IPLD.LinearModel.fromJS({
      a: 10,
      b: 20,
    }),
  );

  // Incoming public stuff
  const q = Query.parse({
    "/a": { $eq: 10 },
    "/b": { $ge: 20 },
  });
  // const q = query.parse([{ "/a": { $eq: 10 }, "/b": { $eq: 25 } }, { "/b": { $eq: 20 } }]);
  // const q = query.parse([
  //   { "/a": { $eq: 15 } },
  //   [{ "/a": { $eq: 10 } }, { "/b": { $eq: 20 } }]
  // ]);
  console.log("q", q);

  console.time("compile");
  const backend = await Backend.compile();
  console.timeEnd("compile");

  console.time("execute.0");
  const proofE = await backend.proveQuery(q).run(map);
  console.timeEnd("execute.0");
  console.log(
    "p.0",
    proofE.publicOutput.trace.toString(),
    proofE.publicOutput.isSatisfied.toString(),
    proofE.publicInput.given.toString(),
    proofE.publicInput.root.toString(),
  );

  console.time("execute.1");
  const proof = await backend.execute(map, q);
  const verification = await Verification.check(q, proof);
  console.timeEnd("execute.1");
  console.log("a", proof, verification);

  // const pathA = LinearPath("/a");
  // const witnessValueA = backend.fromMerkleMapWitness(map.witness(pathA));
  // console.time("proof.a");
  // const proofA = await backend.program.eq(new PublicInput({ root: Field(map.root), given: Field(1) }), witnessValueA);
  // console.timeEnd("proof.a");
  // console.log("proof.a", proofA.publicOutput.toString());

  // const pathB = LinearPath("/b");
  // const witnessB = map.witness(pathB);
  // const witnessValueB = backend.fromMerkleMapWitness(witnessB);
  // console.time("proof.b");
  // const proofB = await backend.program.eq(new PublicInput({ root: Field(map.root), given: Field(2) }), witnessValueB);
  // console.timeEnd("proof.b");
  // console.log("proof.b", proofB.publicOutput.toString());

  // console.time("proof.and");
  // const proofAnd = await backend.program.and(PublicInput.empty(), proofA, proofB);
  // console.timeEnd("proof.and");
  // console.log("proof.and", proofAnd.publicOutput.toString());

  // const given = Field(20);
  // const actual = map.digestOrThrow(pathA);
  // console.log("gt.0", actual, given);
  // const proofGt = await backend.program.gt(
  //   new PublicInput({ root: Field(map.root), given: Field(given) }),
  //   backend.fromMerkleMapWitness(map.witness(pathA)),
  //   actual,
  // );
  //
  // console.log(
  //   "gt",
  //   map.digestOrThrow(pathA).toString(),
  //   proofGt.publicOutput.toString(),
  //   proofGt.publicInput.given.toString(),
  // );
}

main();
