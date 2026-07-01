var BATCH_SIZE = 10000;
var totalStart = Date.now();
var baseFilter = {
  archived: false,
  "reggi.validity": { $ne: false }
};

var totalCount = db.reg_alert_parents.countDocuments(baseFilter);
print("Total matching alerts: " + totalCount);
print("Batch size: " + BATCH_SIZE);
print("─────────────────────────────────────────");

var lastId = ObjectId("000000000000000000000000");
var processed = 0;
var batchNum = 0;

while (true) {
  batchNum++;
  var batchStart = Date.now();

  var batchFilter = Object.assign({}, baseFilter, { _id: { $gt: lastId } });

  var lastDoc = db.reg_alert_parents
    .find(batchFilter, { _id: 1 })
    .sort({ _id: 1 })
    .skip(BATCH_SIZE - 1)
    .limit(1)
    .toArray();

  var isLastBatch = lastDoc.length === 0;
  var upperBound = isLastBatch ? ObjectId("ffffffffffffffffffffffff") : lastDoc[0]._id;

  db.reg_alert_parents.aggregate([
    {
      $match: Object.assign({}, baseFilter, {
        _id: { $gt: lastId, $lte: upperBound },
      }),
    },
    {
      $project: {
        status: 1,
        tenantId: 1,
        created: 1,
        groups: 1,
        owners: 1,
        docStatus: "$info.docStatus",
      },
    },
    {
      $lookup: {
        from: "reg_map_generic",
        localField: "_id",
        foreignField: "srcObject",
        pipeline: [
          {
            $match: {
              archived: { $ne: true },
              destType: "ImpactAssessment",
              srcType: "Alert",
            },
          },
          { $project: { _id: 0, destObject: 1 } },
          { $limit: 1 },
        ],
        as: "iaMapping",
      },
    },
    {
      $lookup: {
        from: "reg_assessments",
        localField: "iaMapping.destObject",
        foreignField: "_id",
        pipeline: [
          { $match: { archived: { $ne: true } } },
          {
            $project: {
              _id: 0,
              status: 1,
              impactLevel: "$customAttributes.IMPACT_LEVEL",
              startDate: 1,
              created: 1,
              owners: 1,
              groups: 1,
            },
          },
        ],
        as: "impactAssessment",
      },
    },
    {
      $project: {
        tenantId: 1,
        status: 1,
        created: 1,
        groups: 1,
        owners: 1,
        docStatus: 1,
        iaId: { $arrayElemAt: ["$iaMapping.destObject", 0] },
        impactStatus: {
          $ifNull: [
            { $arrayElemAt: ["$impactAssessment.status", 0] },
            "No",
          ],
        },
        impactLevel: {
          $arrayElemAt: ["$impactAssessment.impactLevel", 0],
        },
        impactStartDate: {
          $arrayElemAt: ["$impactAssessment.startDate", 0],
        },
        impactCreated: {
          $arrayElemAt: ["$impactAssessment.created", 0],
        },
        impactOwners: {
          $ifNull: [
            { $arrayElemAt: ["$impactAssessment.owners", 0] },
            [],
          ],
        },
        impactGroups: {
          $ifNull: [
            { $arrayElemAt: ["$impactAssessment.groups", 0] },
            [],
          ],
        },
      },
    },
    {
      $merge: {
        into: "mv_enriched_alerts",
        on: "_id",
        whenMatched: "replace",
        whenNotMatched: "insert",
      },
    },
  ], { allowDiskUse: true });

  lastId = upperBound;
  processed = isLastBatch ? totalCount : processed + BATCH_SIZE;
  var batchElapsed = Date.now() - batchStart;
  var pct = ((processed / totalCount) * 100).toFixed(1);
  print(
    "Batch " + batchNum +
    " | " + processed.toLocaleString() + " / " + totalCount.toLocaleString() +
    " (" + pct + "%)" +
    " | " + batchElapsed + "ms"
  );

  if (isLastBatch) break;
}

var totalElapsed = Date.now() - totalStart;
var mvCount = db.mv_enriched_alerts.countDocuments();
print("─────────────────────────────────────────");
print("mv_enriched_alerts created");
print("Document count: " + mvCount);
print("Total time: " + totalElapsed + "ms (" + (totalElapsed / 1000).toFixed(1) + "s)");
print("Sample document:");
printjson(db.mv_enriched_alerts.findOne());
