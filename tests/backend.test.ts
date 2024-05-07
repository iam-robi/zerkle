import {
  MerkleMapFactory,
  Backend,
  IPLD_LINEARIZATION,
  MINA_OPS,
  Verification,
  Query,
  IPLD,
  QueryProgram,
} from "../src/index.js";
import { test } from "uvu";

// test("generate verification key", async () => {
//   const e = await QueryProgram.compile();
//   const verificationKey = e.verificationKey;
//   console.log("verificationKey", verificationKey);
// });

test("prove nested json", async () => {
  const resource = {
    resourceType: "Observation",
    id: "weight",
    meta: {
      profile: ["http://hl7.org/fhir/us/vitals/StructureDefinition/body-weight"],
    },
    extension: [
      {
        url: "http://hl7.org/fhir/StructureDefinition/observation-deviceCode",
        valueCodeableConcept: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "469204003",
              display: "Floor scale, electronic",
            },
          ],
        },
      },
      {
        url: "http://hl7.org/fhir/us/vitals/StructureDefinition/AssociatedSituationExt",
        valueCodeableConcept: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "248160001",
              display: "Undressed",
            },
          ],
        },
      },
    ],
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs",
          },
        ],
        text: "Vital Signs",
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "29463-7",
        },
      ],
      text: "Body weight",
    },
    subject: {
      display: "Small Child1234",
    },
    encounter: {
      display: "GP Visit",
    },
    effectiveDateTime: "2019-10-16T12:12:29-09:00",
    valueQuantity: {
      value: 75,
      unit: "kg",
      system: "http://unitsofmeasure.org",
      code: "kg",
    },
  };
  const query = {
    "/resourceType": {
      $eq: "Observation",
    },
    "/status": {
      $eq: "final",
    },
    "/code/coding/'0/system": {
      $eq: "http://loinc.org",
    },
    "/code/coding/'0/code": {
      $eq: "29463-7",
    },
    "/valueQuantity/unit": {
      $eq: "kg",
    },
    "/valueQuantity/value": {
      $eq: "75",
    },
  };
  const ipldLinear = IPLD.LinearModel.fromJS(resource);
  const map = MerkleMapFactory.fromLinearModel(ipldLinear);

  console.log("ipldLinear", ipldLinear.entries());

  // Incoming public stuff
  const q = Query.parse(query);
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
  console.log("q", q);
  console.log(map);
});

test.run();
