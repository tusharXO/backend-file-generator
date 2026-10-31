const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { validateProject } = require("../shared/dist");

function example() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "../examples/ecommerce.json"), "utf8"));
}

test("the checked-in ecommerce definition is valid", () => {
  assert.deepEqual(validateProject(example()), { valid: true, errors: [] });
});

test("duplicate entity names are rejected", () => {
  const project = example();
  project.entities.push(structuredClone(project.entities[0]));
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /Duplicate entity name/);
});

test("an API cannot refer to an unknown entity", () => {
  const project = example();
  project.apis[0].entity = "MissingEntity";
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /unknown entity/);
});

function rejects(change, message) {
  const project = example();
  change(project);
  const result = validateProject(project);
  assert.equal(result.valid, false, JSON.stringify(project));
  assert.ok(result.errors.length > 0);
  if (message) assert.match(result.errors.join("\n"), message);
}

test("untrusted primitive values and null return errors without throwing", () => {
  for (const input of [null, undefined, false, true, 1, "{}", [], () => {}]) {
    assert.deepEqual(validateProject(input), {
      valid: false,
      errors: ["Project definition must be an object."],
    });
  }
});

test("missing or malformed required collections are reported", () => {
  for (const property of ["entities", "relationships", "apis"]) {
    for (const value of [undefined, null, {}, "array", 3]) {
      rejects((project) => { project[property] = value; }, new RegExp(`project\\.${property} must be an array`));
    }
    rejects((project) => { delete project[property]; }, new RegExp(`project\\.${property}`));
  }
});

test("a project needs at least one entity to generate its database client", () => {
  rejects((project) => { project.entities = []; project.apis = []; }, /must contain at least one entity/);
});

test("project name and version must be present and safe", () => {
  for (const name of [undefined, null, "", "  ", "unsafe/name", "example\n", "name\";throw", "x".repeat(215)]) {
    rejects((project) => { project.name = name; }, /project.name/);
  }
  for (const version of [undefined, null, "", 1, "latest", "1.0"]) {
    rejects((project) => { project.version = version; }, /project.version/);
  }
});

test("unsupported top-level features and typos fail explicitly", () => {
  for (const key of ["workflows", "authentication", "auth", "runtime", "database", "entites"]) {
    rejects((project) => { project[key] = []; }, new RegExp(`project\\.${key} is not supported`));
  }
});

test("relationships are rejected rather than silently discarded", () => {
  rejects((project) => {
    project.relationships.push({ name: "Products", from: "User", to: "Product", type: "one-to-many" });
  }, /Relationships are not supported/);
});

test("malformed entities, fields, and APIs are rejected without throwing", () => {
  for (const value of [null, [], "value", 5]) {
    rejects((project) => { project.entities[0] = value; }, /entities\[0\] must be an object/);
    rejects((project) => { project.entities[0].fields[0] = value; }, /fields\[0\] must be an object/);
    rejects((project) => { project.apis[0] = value; }, /apis\[0\] must be an object/);
  }
  for (const fields of [undefined, null, {}, []]) {
    rejects((project) => { project.entities[0].fields = fields; }, /fields must be a nonempty array/);
  }
});

test("entity names cannot collide in generated filenames ignoring case", () => {
  rejects((project) => {
    const entity = structuredClone(project.entities[0]);
    entity.name = "user";
    project.entities.push(entity);
  }, /Duplicate entity name/);
});

test("duplicate fields and missing primary keys are rejected", () => {
  rejects((project) => {
    project.entities[0].fields.push(structuredClone(project.entities[0].fields[1]));
  }, /duplicate field name/);
  rejects((project) => { project.entities[0].primaryKey = "missing"; }, /unknown primary key/);
});

test("unsafe and reserved generated identifiers are rejected", () => {
  for (const name of ["../User", "User-Name", "User\"", "1User", "User\n", "_User", "x".repeat(64)]) {
    rejects((project) => { project.entities[0].name = name; }, /entities\[0\].name must be an identifier/);
    rejects((project) => { project.entities[0].fields[1].name = name; }, /fields\[1\].name must be an identifier/);
  }
  for (const name of ["PrismaClient", "Prisma", "constructor", "class", "Req", "Res", "Id", "Con", "Prn", "Aux", "Nul", "Com1", "COM9", "Lpt1", "LPT9", "Int", "Float", "DateTime", "Bytes", "Json", "BigInt", "Boolean", "String", "Decimal"]) {
    rejects((project) => { project.entities[0].name = name; }, /reserved identifier/);
  }
  rejects((project) => { project.entities[0].fields[1].name = "__proto__"; }, /must be an identifier/);
});

test("unknown nested properties cannot be silently ignored", () => {
  rejects((project) => { project.entities[0].generateCrud = true; }, /generateCrud is not supported/);
  rejects((project) => { project.entities[0].fields[1].maxLenght = 8; }, /maxLenght is not supported/);
  rejects((project) => { project.apis[0].authenticated = true; }, /authenticated is not supported/);
});

test("field type and required flags receive runtime validation", () => {
  for (const type of [undefined, null, "uuid", "decimal", "nonsense", 1]) {
    rejects((project) => { project.entities[0].fields[1].type = type; }, /\.type must be/);
  }
  for (const flag of ["required", "unique", "nullable"]) {
    for (const value of [undefined, null, "true", 0]) {
      rejects((project) => { project.entities[0].fields[1][flag] = value; }, new RegExp(`\\.${flag} must be a boolean`));
    }
  }
});

test("integer and client-supplied string primary keys are supported", () => {
  const project = example();
  project.entities[0].fields[0].type = "string";
  project.entities[0].fields[0].minLength = 1;
  assert.deepEqual(validateProject(project), { valid: true, errors: [] });
});

test("string primary-key constraints must allow a nonempty ID", () => {
  rejects((project) => {
    Object.assign(project.entities[0].fields[0], { type: "string", minLength: 0, maxLength: 0 });
  }, /string primary keys require maxLength of at least 1/);
  const project = example();
  Object.assign(project.entities[0].fields[0], { type: "string", minLength: 0, maxLength: 1 });
  assert.deepEqual(validateProject(project), { valid: true, errors: [] });
});

test("other primary-key types and incompatible primary-key options are rejected", () => {
  for (const type of ["number", "boolean", "date", "datetime"]) {
    rejects((project) => { project.entities[0].fields[0].type = type; }, /primary keys support only integer.*string/);
  }
  rejects((project) => { project.entities[0].fields[0].required = false; }, /primary keys must be required and nonnullable/);
  rejects((project) => { project.entities[0].fields[0].nullable = true; }, /primary keys must be required and nonnullable/);
  rejects((project) => { project.entities[0].fields[0].defaultValue = 1; }, /primary keys cannot specify/);
  rejects((project) => { project.entities[0].fields[0].autoGenerated = "createdAt"; }, /primary keys cannot specify/);
});

test("string length constraints must be nonnegative integers in order", () => {
  for (const key of ["minLength", "maxLength"]) {
    for (const value of [-1, 1.5, "3", null, NaN, Infinity]) {
      rejects((project) => { project.entities[0].fields[1][key] = value; }, /must be a nonnegative safe integer/);
    }
    rejects((project) => { project.entities[1].fields[2][key] = 3; }, /supported only for string/);
  }
  rejects((project) => {
    project.entities[0].fields[1].minLength = 101;
  }, /minLength must not exceed maxLength/);
});

test("matching primitive defaults and automatic timestamps are supported", () => {
  const project = example();
  project.entities[0].fields[1].defaultValue = "Guest";
  project.entities[1].fields[2].defaultValue = 0;
  project.entities[1].fields.push({ name: "stock", type: "integer", required: false, unique: false, nullable: false, defaultValue: 0 });
  project.entities[1].fields.push({ name: "active", type: "boolean", required: false, unique: false, nullable: false, defaultValue: true });
  project.entities[0].fields.push({ name: "updatedAt", type: "datetime", required: false, unique: false, nullable: false, autoGenerated: "updatedAt" });
  assert.deepEqual(validateProject(project), { valid: true, errors: [] });
});

test("defaults must match their types and string constraints", () => {
  for (const value of [null, false, 2, {}, []]) {
    rejects((project) => { project.entities[0].fields[1].defaultValue = value; }, /defaultValue must match/);
  }
  rejects((project) => { project.entities[0].fields[1].defaultValue = "x"; }, /shorter than minLength/);
  rejects((project) => { project.entities[0].fields[1].defaultValue = "x".repeat(101); }, /longer than maxLength/);
  rejects((project) => { project.entities[1].fields[2].defaultValue = Infinity; }, /defaultValue must match/);
  for (const value of [2.5, 2147483648, -2147483649]) {
    rejects((project) => {
      project.entities[1].fields.push({ name: "stock", type: "integer", required: false, unique: false, nullable: false, defaultValue: value });
    }, /defaultValue must match/);
  }
  rejects((project) => {
    delete project.entities[0].fields[3].autoGenerated;
    project.entities[0].fields[3].defaultValue = "2026-01-01";
  }, /date defaults are not supported/);
});

test("optional nonnullable fields require a default or automatic generation", () => {
  rejects((project) => { project.entities[0].fields[1].required = false; }, /optional nonnullable field requires defaultValue/);
  const project = example();
  project.entities[0].fields[1].required = false;
  project.entities[0].fields[1].nullable = true;
  assert.deepEqual(validateProject(project), { valid: true, errors: [] });
});

test("automatic timestamps reject incompatible definitions", () => {
  rejects((project) => { project.entities[0].fields[3].autoGenerated = "now"; }, /must be createdAt or updatedAt/);
  rejects((project) => { project.entities[0].fields[3].type = "string"; }, /requires a date or datetime/);
  rejects((project) => { project.entities[0].fields[3].nullable = true; }, /must be nonnullable/);
  rejects((project) => { project.entities[0].fields[3].defaultValue = "2026-01-01"; }, /cannot combine autoGenerated with defaultValue/);
});

test("CRUD operation and HTTP method pairs must be implemented", () => {
  for (const [method, operation] of [["POST", "list"], ["GET", "create"], ["PATCH", "update"], ["PUT", "get"], ["HEAD", "list"], ["GET", "custom"], ["GET", undefined]]) {
    rejects((project) => { Object.assign(project.apis[0], { method, operation }); }, /operation|method|PATCH/);
  }
  rejects((project) => { delete project.apis[0].entity; }, /entity must be provided/);
});

test("primary-key route parameters are matched as complete segments", () => {
  for (const path of ["/users/:identity", "/users/id", "/users/:userId", "/users/:id/:extra", "/users/:id/:id"]) {
    rejects((project) => { project.apis[2].path = path; }, /exactly one parameter :id/);
  }
  rejects((project) => { project.apis[0].path = "/users/:id"; }, /cannot contain parameters for list or create/);
  rejects((project) => { project.apis[1].path = "/users/:id"; }, /cannot contain parameters for list or create/);
});

test("Express 5 patterns and unsafe paths are rejected before generation", () => {
  for (const path of [undefined, null, "users", "/", "/users//detail", "/users/*", "/users/:id?", "/users/:id(\\d+)", "/users/{:id}", "/users?active=1", "/users#fragment", "/users/\";throw", "/users\n", "/users/../items", "/users\\items"]) {
    rejects((project) => { project.apis[0].path = path; }, /path must contain only/);
  }
});

test("the generated GET health endpoint is reserved", () => {
  for (const path of ["/health", "/HEALTH", "/health/"]) {
    rejects((project) => { project.apis[0].path = path; }, /GET \/health is reserved/);
  }
  rejects((project) => { project.apis[2].path = "/:id"; }, /GET \/health is reserved/);
});

test("same-method static and dynamic routes cannot shadow one another", () => {
  for (const paths of [["/users/:id", "/users/search"], ["/USERS/:id/", "/users/search/"]]) {
    rejects((project) => {
      project.apis[2].path = paths[0];
      project.apis[5].path = paths[1];
    }, /ambiguous API route.*overlaps/);
  }
  rejects((project) => {
    project.apis[2].path = "/users/:id/details";
    project.apis[5].path = "/users/current/details";
  }, /ambiguous API route.*overlaps/);
});

test("equivalent API routes are rejected including case and parameter-name differences", () => {
  rejects((project) => {
    project.apis.push({ ...project.apis[0], name: "Duplicate users", path: "/USERS/" });
  }, /duplicate API route/);
  rejects((project) => {
    const secondEntity = project.entities[1];
    secondEntity.primaryKey = "key";
    secondEntity.fields[0].name = "key";
    project.apis.push({ name: "Get product using conflicting path", method: "GET", operation: "get", entity: "Product", path: "/users/:key" });
  }, /duplicate API route/);
});

test("hostile property getters return an error without escaping the validator", () => {
  const project = example();
  Object.defineProperty(project, "name", { get() { throw new Error("unreadable"); } });
  assert.equal(validateProject(project).valid, false);
  assert.match(validateProject(project).errors.join("\n"), /could not be read/);
});
