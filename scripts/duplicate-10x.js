// ═══════════════════════════════════════════════════════════════════════════════
// Focused 10x data generation: reg_alert_parents, reg_assessments, reg_map_generic
//
// Usage:
//   mongosh "mongodb://<host>:<port>/RegHub" --file duplicate-10x.js
//   mongosh "mongodb+srv://<user>:<pass>@<cluster>/RegHub" --file duplicate-10x.js
// ═══════════════════════════════════════════════════════════════════════════════

const DB_NAME = "RegHub";
const COPIES = 9;
const BATCH_SIZE = 10000;
const IA_PERCENT = 0.3;

const CLONE_MARKER = "_cloned10x";
const CLONE_TIMESTAMP = new Date();

const SEVERITY_ENUM = ["Very High", "High", "Medium", "Low", "Very Low"];
const IMPACT_LEVELS = ["NO_IMPACT", "Low", "Medium", "High", "Critical"];
const IA_STATUSES = ["New", "In Process", "Closed"];
const DOC_STATUS_ENUM = [
  "Introduced", "Passed Body of Origin", "Passed Second Body",
  "Sent for Signature", "Died", "Became Law", "Statute", "Regulation",
  "Rule", "Proposed Rule", "Bulletins/Reports", "Calendar",
  "Enforcement Actions", "Feed", "Information and Guidance",
  "News/Press Releases", "Notice", "Public Notices",
  "Publications/Communications", "Rulemaking", "Settlements",
  "Presidential Document"
];

const TARGET_COLLECTIONS = ["reg_alert_parents", "reg_assessments", "reg_map_generic"];

const database = db.getSiblingDB(DB_NAME);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  if (!arr || arr.length === 0) return [];
  const shuffled = arr.slice().sort(function () { return 0.5 - Math.random(); });
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function jitterDate(date, maxDaysOffset) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return date;
  const offsetMs = (Math.random() * 2 - 1) * maxDaysOffset * 86400000;
  return new Date(date.getTime() + offsetMs);
}

function cloneDoc(doc) {
  const c = Object.assign({}, doc);
  delete c._id;
  c[CLONE_MARKER] = CLONE_TIMESTAMP;
  return c;
}

function insertBatch(coll, docs) {
  if (docs.length === 0) return 0;
  try {
    const result = coll.insertMany(docs, { ordered: false });
    return result.insertedIds ? Object.keys(result.insertedIds).length : docs.length;
  } catch (e) {
    if (e.insertedIds) {
      const inserted = Object.keys(e.insertedIds).length;
      const failed = docs.length - inserted;
      if (failed > 0) print("    warning: " + inserted + "/" + docs.length + " inserted, " + failed + " failed: " + e.message.slice(0, 120));
      return inserted;
    }
    print("    error: batch failed: " + e.message.slice(0, 200));
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 0: Setup
// ═══════════════════════════════════════════════════════════════════════════════

print("=== Focused 10x Data Generation ===");
print("Target: reg_alert_parents, reg_assessments, reg_map_generic");
print("Copies per document: " + COPIES);
print("Impact assessment rate: " + (IA_PERCENT * 100) + "%\n");

// --- 0a: Disable schema validation ---
print("[PHASE 0] Setup...\n");

const savedValidation = {};
for (const name of TARGET_COLLECTIONS) {
  try {
    const info = database.getCollectionInfos({ name: name })[0];
    if (info && info.options && info.options.validator) {
      const level = info.options.validationLevel || "strict";
      const action = info.options.validationAction || "error";
      savedValidation[name] = { level: level, action: action };
      database.runCommand({ collMod: name, validationLevel: "off" });
      print("  Disabled validation on " + name + " (was " + level + "/" + action + ")");
    }
  } catch (e) {
    print("  Could not check validation for " + name + ": " + e.message.slice(0, 100));
  }
}

// --- 0b: Build per-tenant lookups ---
print("  Building per-tenant lookups...");

const usersByTenant = {};
database.users.find({ archived: { $ne: true } }, { _id: 1, tenantId: 1 }).forEach(function (u) {
  const t = (u.tenantId || "").toString();
  if (!usersByTenant[t]) usersByTenant[t] = [];
  usersByTenant[t].push(u._id);
});

const groupsByTenant = {};
database.reg_groups.find({ archived: { $ne: true } }, { _id: 1, tenantId: 1 }).forEach(function (g) {
  const t = (g.tenantId || "").toString();
  if (!groupsByTenant[t]) groupsByTenant[t] = [];
  groupsByTenant[t].push(g._id);
});

const statusesByTenant = {};
database.reg_config.find({}, { _id: 1, tenantId: 1, status: 1 }).forEach(function (cfg) {
  const t = (cfg.tenantId || "").toString();
  if (!statusesByTenant[t]) statusesByTenant[t] = [];
  const s = cfg.status || {};
  if (s.regChange && Array.isArray(s.regChange)) {
    s.regChange.forEach(function (st) {
      if (st.id) statusesByTenant[t].push(st.id.toString());
    });
  }
});

print("    " + Object.keys(usersByTenant).length + " tenants with users");
print("    " + Object.keys(groupsByTenant).length + " tenants with groups");
print("    " + Object.keys(statusesByTenant).length + " tenants with regChange statuses");

// --- 0c: Determine max IA counter per tenant ---
print("  Scanning max IA counters...");

const iaCounterByTenant = {};
database.reg_assessments.find({}, { id: 1, tenantId: 1 }).forEach(function (doc) {
  const t = (doc.tenantId || "").toString();
  if (doc.id && typeof doc.id === "string") {
    const match = doc.id.match(/IA-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!iaCounterByTenant[t] || num > iaCounterByTenant[t]) {
        iaCounterByTenant[t] = num;
      }
    }
  }
});

print("    Scanned IA counters for " + Object.keys(iaCounterByTenant).length + " tenants");

// --- 0d: Before counts ---
print("\n--- Before counts ---");
for (const name of TARGET_COLLECTIONS) {
  print("  " + name + ": " + database.getCollection(name).countDocuments());
}
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: Clone reg_alert_parents (batch-read 10K originals, then clone+insert)
// ═══════════════════════════════════════════════════════════════════════════════

print("[PHASE 1] Cloning reg_alert_parents...\n");

const alertsColl = database.reg_alert_parents;
const alertTotal = alertsColl.countDocuments({ _cloned10x: { $exists: false } });
const alertInsertTarget = alertTotal * COPIES;
print("  Originals:      " + alertTotal);
print("  Clones to make: " + alertInsertTarget);
print("  Final target:   " + (alertTotal + alertInsertTarget));
print("");

let alertsInserted = 0;
let alertsRead = 0;
const alertStart = Date.now();

let clonedAlerts = [];

let lastLog = Date.now();
const LOG_INTERVAL = 1000;

for (let copy = 1; copy <= COPIES; copy++) {
  const copyStart = Date.now();
  let copyInserted = 0;
  alertsRead = 0;

  const alertCursor = alertsColl.find({ _cloned10x: { $exists: false } }).batchSize(BATCH_SIZE);
  let insertBuf = [];

  while (alertCursor.hasNext()) {
    const doc = alertCursor.next();
    alertsRead++;
    const tid = (doc.tenantId || "").toString();

    const c = cloneDoc(doc);
    c._id = new ObjectId();

    c.archived = false;
    if (!c.reggi || typeof c.reggi !== "object") c.reggi = {};
    c.reggi.validity = true;

    c.info = c.info ? Object.assign({}, c.info) : {};
    c.info.docStatus = pick(DOC_STATUS_ENUM);

    const tenantStatuses = statusesByTenant[tid];
    if (tenantStatuses && tenantStatuses.length > 0) {
      c.status = pick(tenantStatuses);
    }

    c.severity = pick(SEVERITY_ENUM);

    const tenantUsers = usersByTenant[tid];
    if (tenantUsers && tenantUsers.length > 0) {
      c.owners = pickN(tenantUsers, 1 + Math.floor(Math.random() * 3));
    }

    const tenantGroups = groupsByTenant[tid];
    if (tenantGroups && tenantGroups.length > 0) {
      c.groups = pickN(tenantGroups, 1 + Math.floor(Math.random() * 2));
    }

    if (c.publishedDate) c.publishedDate = jitterDate(c.publishedDate, 180);
    if (c.created) c.created = jitterDate(c.created, 90);
    if (c.updated) c.updated = jitterDate(c.updated, 30);
    if (c.effectiveDate) c.effectiveDate = jitterDate(c.effectiveDate, 180);
    if (c.summaryUpdated) c.summaryUpdated = jitterDate(c.summaryUpdated, 90);

    clonedAlerts.push({ alertId: c._id, tenantId: tid, created: c.created });
    insertBuf.push(c);

    if (insertBuf.length >= BATCH_SIZE) {
      const ins = insertBatch(alertsColl, insertBuf);
      copyInserted += ins;
      alertsInserted += ins;
      insertBuf = [];

      const now = Date.now();
      if (now - lastLog >= LOG_INTERVAL) {
        const elapsed = ((now - alertStart) / 1000).toFixed(1);
        const pct = ((alertsRead / alertTotal) * 100).toFixed(0);
        const totalPct = ((alertsInserted / alertInsertTarget) * 100).toFixed(1);
        print("  [copy " + copy + "/" + COPIES + "] read " + alertsRead + "/" + alertTotal + " (" + pct + "%) | total inserted " + alertsInserted + "/" + alertInsertTarget + " (" + totalPct + "%) | " + elapsed + "s");
        lastLog = now;
      }
    }
  }

  if (insertBuf.length > 0) {
    const ins = insertBatch(alertsColl, insertBuf);
    copyInserted += ins;
    alertsInserted += ins;
    insertBuf = [];
  }

  const copyElapsed = ((Date.now() - copyStart) / 1000).toFixed(1);
  const totalPct = ((alertsInserted / alertInsertTarget) * 100).toFixed(1);
  print("  [copy " + copy + "/" + COPIES + " DONE] +" + copyInserted + " in " + copyElapsed + "s | total: " + alertsInserted + "/" + alertInsertTarget + " (" + totalPct + "%)");
  lastLog = Date.now();
}

const alertElapsed = ((Date.now() - alertStart) / 1000).toFixed(1);
print("\n[DONE] reg_alert_parents: +" + alertsInserted + " in " + alertElapsed + "s");
print("  Tracked " + clonedAlerts.length + " cloned alert IDs for Phase 2\n");

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: Create reg_assessments for ~30% of cloned alerts
// ═══════════════════════════════════════════════════════════════════════════════

print("[PHASE 2] Creating reg_assessments for ~" + (IA_PERCENT * 100) + "% of cloned alerts...\n");

const assessmentsColl = database.reg_assessments;
const mapGenericColl = database.reg_map_generic;

// Select ~30% of cloned alerts
const selectedAlerts = [];
for (let i = 0; i < clonedAlerts.length; i++) {
  if (Math.random() < IA_PERCENT) {
    selectedAlerts.push(clonedAlerts[i]);
  }
}

print("  Selected " + selectedAlerts.length + " alerts for impact assessments");

let iaInserted = 0;
let mapInserted = 0;
const iaStart = Date.now();
let iaLastLog = Date.now();

let iaBatch = [];
let mapBatch = [];

for (let i = 0; i < selectedAlerts.length; i++) {
  const alert = selectedAlerts[i];
  const tid = alert.tenantId;

  if (!iaCounterByTenant[tid]) iaCounterByTenant[tid] = 0;
  iaCounterByTenant[tid]++;
  const iaId = "IA-" + iaCounterByTenant[tid];

  const iaCreated = alert.created ? jitterDate(alert.created, 30) : new Date();
  const iaDoc = {
    id: iaId,
    startDate: iaCreated,
    endDate: null,
    updated: iaCreated,
    created: iaCreated,
    createdBy: null,
    updatedBy: null,
    archived: false,
    owners: [],
    groups: [],
    customAttributes: {
      IMPACT_LEVEL: pick(IMPACT_LEVELS)
    },
    status: pick(IA_STATUSES),
    impactFiles: [],
    tenantId: tid,
    __v: 0
  };
  iaDoc[CLONE_MARKER] = CLONE_TIMESTAMP;

  const tenantUsers = usersByTenant[tid];
  if (tenantUsers && tenantUsers.length > 0) {
    iaDoc.owners = pickN(tenantUsers, 1 + Math.floor(Math.random() * 2));
    iaDoc.createdBy = pick(tenantUsers);
  }

  const tenantGroups = groupsByTenant[tid];
  if (tenantGroups && tenantGroups.length > 0) {
    iaDoc.groups = pickN(tenantGroups, 1);
  }

  iaBatch.push({ doc: iaDoc, alertId: alert.alertId, tenantId: tid, created: iaCreated });

  if (iaBatch.length >= BATCH_SIZE) {
    const iaDocs = iaBatch.map(function (b) { return b.doc; });
    const insCount = insertBatch(assessmentsColl, iaDocs);
    iaInserted += insCount;

    for (let j = 0; j < iaBatch.length; j++) {
      if (iaBatch[j].doc._id) {
        const mapDoc = {
          srcType: "Alert",
          srcObject: iaBatch[j].alertId,
          destType: "ImpactAssessment",
          destObject: iaBatch[j].doc._id,
          archived: false,
          updated: iaBatch[j].created,
          created: iaBatch[j].created,
          changedBy: iaBatch[j].doc.createdBy || null,
          tenantId: iaBatch[j].tenantId,
          __v: 0
        };
        mapDoc[CLONE_MARKER] = CLONE_TIMESTAMP;
        mapBatch.push(mapDoc);
      }
    }

    if (mapBatch.length >= BATCH_SIZE) {
      mapInserted += insertBatch(mapGenericColl, mapBatch);
      mapBatch = [];
    }

    iaBatch = [];

    const now = Date.now();
    if (now - iaLastLog >= LOG_INTERVAL) {
      const elapsed = ((now - iaStart) / 1000).toFixed(1);
      const pct = (((i + 1) / selectedAlerts.length) * 100).toFixed(1);
      print("  " + (i + 1) + "/" + selectedAlerts.length + " (" + pct + "%) | assessments: " + iaInserted + " | maps: " + mapInserted + " | " + elapsed + "s");
      iaLastLog = now;
    }
  }
}

// Flush remaining assessments
if (iaBatch.length > 0) {
  const iaDocs = iaBatch.map(function (b) { return b.doc; });
  const insCount = insertBatch(assessmentsColl, iaDocs);
  iaInserted += insCount;

  for (let j = 0; j < iaBatch.length; j++) {
    if (iaBatch[j].doc._id) {
      const mapDoc = {
        srcType: "Alert",
        srcObject: iaBatch[j].alertId,
        destType: "ImpactAssessment",
        destObject: iaBatch[j].doc._id,
        archived: false,
        updated: iaBatch[j].created,
        created: iaBatch[j].created,
        changedBy: iaBatch[j].doc.createdBy || null,
        tenantId: iaBatch[j].tenantId,
        __v: 0
      };
      mapDoc[CLONE_MARKER] = CLONE_TIMESTAMP;
      mapBatch.push(mapDoc);
    }
  }
  iaBatch = [];
}

// Flush remaining maps
if (mapBatch.length > 0) {
  mapInserted += insertBatch(mapGenericColl, mapBatch);
  mapBatch = [];
}

const iaElapsed = ((Date.now() - iaStart) / 1000).toFixed(1);
print("\n[DONE] reg_assessments: +" + iaInserted + " in " + iaElapsed + "s");
print("[DONE] reg_map_generic: +" + mapInserted + " in " + iaElapsed + "s\n");

// Free memory
clonedAlerts = null;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: Restore and report
// ═══════════════════════════════════════════════════════════════════════════════

if (Object.keys(savedValidation).length > 0) {
  print("[PHASE 3] Restoring schema validation...\n");
  for (const name of Object.keys(savedValidation)) {
    const cfg = savedValidation[name];
    try {
      database.runCommand({
        collMod: name,
        validationLevel: cfg.level,
        validationAction: cfg.action,
      });
      print("  Restored " + name + " to " + cfg.level + "/" + cfg.action);
    } catch (e) {
      print("  Failed to restore " + name + ": " + e.message.slice(0, 100));
    }
  }
  print("");
}

print("--- After counts ---");
for (const name of TARGET_COLLECTIONS) {
  print("  " + name + ": " + database.getCollection(name).countDocuments());
}

print("\nAll cloned records tagged with: { " + CLONE_MARKER + ": ISODate(\"" + CLONE_TIMESTAMP.toISOString() + "\") }");
print("\nTo delete all cloned data, run in mongosh:\n");
print('  const db = db.getSiblingDB("' + DB_NAME + '");');
print('  ["reg_alert_parents","reg_assessments","reg_map_generic"].forEach(function(c) {');
print('    const r = db.getCollection(c).deleteMany({' + CLONE_MARKER + ':{$exists:true}});');
print('    print(c + ": deleted " + r.deletedCount);');
print("  });");

print("\n=== Generation complete ===");
