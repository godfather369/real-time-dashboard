var startTime = Date.now();

var TENANT_ID = "638f19922bd40da1fc9bd594";
var DAYS_BACK = 90;

var now = new Date();
var dateStart = new Date(now.getTime() - (DAYS_BACK * 24 * 60 * 60 * 1000));
var dateLabel = "Last " + DAYS_BACK + " days (" + dateStart.toISOString().slice(0, 10) + " to " + now.toISOString().slice(0, 10) + ")";

var docStatusFilter = []; // e.g. ["Published"] or ["Published", "Draft"] — leave [] for all

// ─────────────────────────────────────────
// Build match filter
// ─────────────────────────────────────────
var matchFilter = {
  tenantId: TENANT_ID,
  created: { $gte: dateStart, $lte: now },
  impactStatus: { $nin: ["No"] }
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
// Aggregate Query
// open: impactStatus IN ('New', 'In Process')
// closed: impactStatus = 'Closed'
// ─────────────────────────────────────────
var results = db.mv_enriched_alerts.aggregate([
  { $match: matchFilter },

  { $unwind: "$owners" },

  {
    $group: {
      _id: "$owners",

      open: {
        $sum: {
          $cond: [
            {
              $or: [
                { $eq: ["$impactStatus", "New"] },
                { $eq: ["$impactStatus", "In Process"] }
              ]
            },
            1,
            0
          ]
        }
      },

      closed: {
        $sum: {
          $cond: [
            { $eq: ["$impactStatus", "Closed"] },
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
print("Impact Assessment SLA by Owners — Instantaneous");
print("Range: " + dateLabel);
print("docStatus filter: " + (docStatusFilter.length > 0 ? JSON.stringify(docStatusFilter) : "ALL"));
print("Time: " + elapsed + "ms (" + (elapsed / 1000).toFixed(1) + "s)");
print("─────────────────────────────────────────");
print("Owners returned: " + results.length);
print("─────────────────────────────────────────");
results.forEach(function (r) {
  printjson(r);
});
