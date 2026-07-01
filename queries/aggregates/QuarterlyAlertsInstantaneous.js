var startTime = Date.now();

var TENANT_ID = "638f19922bd40da1fc9bd594";
var QUARTER = "Q2";  // Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec
var YEAR = 2026;

var quarterMonths = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 };
var quarterStart = new Date(YEAR, quarterMonths[QUARTER], 1);
var quarterEnd = new Date(YEAR, quarterMonths[QUARTER] + 3, 1);
var quarterLabel = QUARTER + " " + YEAR + " (" + quarterStart.toISOString().slice(0, 10) + " to " + quarterEnd.toISOString().slice(0, 10) + ")";

var docStatusFilter = []; // e.g. ["Published"] or ["Published", "Draft"] — leave [] for all

// ─────────────────────────────────────────
// Pre-fetch status config for this tenant
// ─────────────────────────────────────────
var configDoc = db.reg_config.findOne({ tenantId: TENANT_ID });

var statusMap = {};
if (configDoc && configDoc.status && configDoc.status.regChange) {
  configDoc.status.regChange.forEach(function (s) {
    if (s.active === true) {
      statusMap[s.id] = {
        isTerminal: s.isTerminal === true,
        isExcluded: s.isExcluded === true,
        isFollowing: (s.meta && s.meta.isFollowing) === true,
        actionRequired: s.actionRequired === true
      };
    }
  });
}

print("Status map loaded: " + Object.keys(statusMap).length + " active statuses");

// ─────────────────────────────────────────
// Build match filter
// ─────────────────────────────────────────
var matchFilter = {
  tenantId: TENANT_ID,
  created: { $gte: quarterStart, $lt: quarterEnd }
};

if (docStatusFilter.length > 0) {
  matchFilter.docStatus = { $in: docStatusFilter };
}

var hintIndex = docStatusFilter.length > 0
  ? { tenantId: 1, docStatus: 1, created: -1 }
  : { tenantId: 1, created: -1 };

// Build arrays of statusIds for each category from the pre-fetched config
var excludedStatuses = [];
var followingStatuses = [];
var openStatuses = [];
var applicableStatuses = [];
var potentialImpEligibleStatuses = [];

Object.keys(statusMap).forEach(function (sid) {
  var s = statusMap[sid];
  if (s.isExcluded) {
    excludedStatuses.push(sid);
  } else {
    // not excluded — contributes to totalCount
    if (s.isFollowing) followingStatuses.push(sid);
    if (!s.isTerminal) openStatuses.push(sid);
    if (s.actionRequired && s.isTerminal) applicableStatuses.push(sid);
    if (s.isTerminal || s.isFollowing) potentialImpEligibleStatuses.push(sid);
  }
});

// ─────────────────────────────────────────
// Aggregate Query
// ─────────────────────────────────────────
var results = db.mv_enriched_alerts.aggregate([
  { $match: matchFilter },

  {
    $group: {
      _id: null,

      following: {
        $sum: {
          $cond: [
            { $in: ["$status", followingStatuses] },
            1,
            0
          ]
        }
      },

      open: {
        $sum: {
          $cond: [
            { $in: ["$status", openStatuses] },
            1,
            0
          ]
        }
      },

      applicable: {
        $sum: {
          $cond: [
            { $in: ["$status", applicableStatuses] },
            1,
            0
          ]
        }
      },

      excluded: {
        $sum: {
          $cond: [
            { $in: ["$status", excludedStatuses] },
            1,
            0
          ]
        }
      },

      potentialImp: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ["$impactLevel", "CB - N/A"] },
                { $in: ["$status", potentialImpEligibleStatuses] }
              ]
            },
            1,
            0
          ]
        }
      }
    }
  },

  {
    $project: {
      _id: 0,
      following: 1,
      open: 1,
      applicable: 1,
      excluded: 1,
      potentialImp: 1
    }
  }
], {
  allowDiskUse: true,
  hint: hintIndex
}).toArray();

var elapsed = Date.now() - startTime;
print("─────────────────────────────────────────");
print("Quarterly Alerts — Instantaneous Results");
print("Quarter: " + quarterLabel);
print("docStatus filter: " + (docStatusFilter.length > 0 ? JSON.stringify(docStatusFilter) : "ALL"));
print("Time: " + elapsed + "ms (" + (elapsed / 1000).toFixed(1) + "s)");
print("─────────────────────────────────────────");
printjson(results[0]);
