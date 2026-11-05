import assert from "node:assert/strict";
import { isExcludedProjectPath } from "../src/lib/projectExclusions";
assert.equal(isExcludedProjectPath("/goa/projects/indus-amalfi-suites"), true);
assert.equal(isExcludedProjectPath("/goa/projects/indus-amalfi-suites/"), true);
assert.equal(isExcludedProjectPath("/hyderabad/projects/indus-amalfi-suites"), true);
assert.equal(isExcludedProjectPath("/goa/projects/indus-amalfi-suites-phase-2"), false);
assert.equal(isExcludedProjectPath("/goa/projects/indus-other"), false);
console.log("Project removal route regression checks passed");
