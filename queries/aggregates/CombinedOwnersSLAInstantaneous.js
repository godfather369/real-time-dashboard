var startTime = Date.now();

var TENANT_ID = "638f19922bd40da1fc9bd594";
var DAYS_BACK = 90;

var now = new Date();
var dateStart = new Date(now.getTime() - (DAYS_BACK * 24 * 60 * 60 * 1000));
var dateLabel = "Last " + DAYS_BACK + " days (" + dateStart.toISOString().slice(0, 10) + " to " + now.toISOString().slice(0, 10) + ")";

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
        isTerminal: s.isTerminal === true
      };
    }
  });
}

print("Status map loaded: " + Object.keys(statusMap).length + " active statuses");

var terminalStatuses = [];
var nonTerminalStatuses = [];
Object.keys(statusMap).forEach(function (sid) {
  if (statusMap[sid].isTerminal) {
    terminalStatuses.push(sid);
  } else {
    nonTerminalStatuses.push(sid);
  }
});

// ─────────────────────────────────────────
// Build match filter
// ─────────────────────────────────────────
var matchFilter = {
  tenantId: TENANT_ID,
  created: { $gte: dateStart, $lte: now }
};

if (docStatusFilter.length > 0) {
  matchFilter.docStatus = { $in: docStatusFilter };
}

var hintIndex = docStatusFilter.length > 0
  ? { tenantId: 1, docStatus: 1, created: -1 }
  : { tenantId: 1, created: -1 };

// ─────────────────────────────────────────
// Pre-fetch user names for this tenant
// ─────────────────────────────────────────
var userMap = {};
db.users.find(
  { tenantId: TENANT_ID },
  { _id: 1, fullName: 1 }
).forEach(function (u) {
  var key = u._id.str || u._id.toString();
  userMap[key] = u.fullName || "Unknown";
});

print("Users loaded: " + Object.keys(userMap).length);

// ─────────────────────────────────────────
// Aggregate Query — crosses alert status (isTerminal) with impactStatus
// openOpen:    NOT isTerminal AND impactStatus IN ('New', 'In Process')
// openClosed:  NOT isTerminal AND impactStatus = 'Closed'
// openMissing: NOT isTerminal AND impactStatus = 'No'
// closedOpen:    isTerminal AND impactStatus IN ('New', 'In Process')
// closedClosed:  isTerminal AND impactStatus = 'Closed'
// closedMissing: isTerminal AND impactStatus = 'No'
// open:  NOT isTerminal (all)
// closed: isTerminal (all)
// ─────────────────────────────────────────
var results = db.mv_enriched_alerts.aggregate([
  { $match: matchFilter },

  { $unwind: "$owners" },

  {
    $group: {
      _id: "$owners",

      openOpen: {
        $sum: {
          $cond: [
            {
              $and: [
                { $in: ["$status", nonTerminalStatuses] },
                { $or: [
                  { $eq: ["$impactStatus", "New"] },
                  { $eq: ["$impactStatus", "In Process"] }
                ]}
              ]
            },
            1,
            0
          ]
        }
      },

      openClosed: {
        $sum: {
          $cond: [
            {
              $and: [
                { $in: ["$status", nonTerminalStatuses] },
                { $eq: ["$impactStatus", "Closed"] }
              ]
            },
            1,
            0
          ]
        }
      },

      openMissing: {
        $sum: {
          $cond: [
            {
              $and: [
                { $in: ["$status", nonTerminalStatuses] },
                { $eq: ["$impactStatus", "No"] }
              ]
            },
            1,
            0
          ]
        }
      },

      closedOpen: {
        $sum: {
          $cond: [
            {
              $and: [
                { $in: ["$status", terminalStatuses] },
                { $or: [
                  { $eq: ["$impactStatus", "New"] },
                  { $eq: ["$impactStatus", "In Process"] }
                ]}
              ]
            },
            1,
            0
          ]
        }
      },

      closedClosed: {
        $sum: {
          $cond: [
            {
              $and: [
                { $in: ["$status", terminalStatuses] },
                { $eq: ["$impactStatus", "Closed"] }
              ]
            },
            1,
            0
          ]
        }
      },

      closedMissing: {
        $sum: {
          $cond: [
            {
              $and: [
                { $in: ["$status", terminalStatuses] },
                { $eq: ["$impactStatus", "No"] }
              ]
            },
            1,
            0
          ]
        }
      },

      open: {
        $sum: {
          $cond: [
            { $in: ["$status", nonTerminalStatuses] },
            1,
            0
          ]
        }
      },

      closed: {
        $sum: {
          $cond: [
            { $in: ["$status", terminalStatuses] },
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
      ownerId: "$_id",
      openOpen: 1,
      openClosed: 1,
      openMissing: 1,
      closedOpen: 1,
      closedClosed: 1,
      closedMissing: 1,
      open: 1,
      closed: 1
    }
  },

  { $sort: { open: -1 } }
], {
  allowDiskUse: true,
  hint: hintIndex
}).toArray();

results.forEach(function (r) {
  var key = r.ownerId.str || r.ownerId.toString();
  r.ownerName = userMap[key] || "Unknown";
});

var elapsed = Date.now() - startTime;
print("─────────────────────────────────────────");
print("Combined Owners SLA — Instantaneous");
print("Range: " + dateLabel);
print("docStatus filter: " + (docStatusFilter.length > 0 ? JSON.stringify(docStatusFilter) : "ALL"));
print("Time: " + elapsed + "ms (" + (elapsed / 1000).toFixed(1) + "s)");
print("─────────────────────────────────────────");
print("Owners returned: " + results.length);
print("─────────────────────────────────────────");
results.forEach(function (r) {
  printjson(r);
});
