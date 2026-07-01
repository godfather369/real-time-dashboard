-- ═══════════════════════════════════════════════════════════════════════════════
-- Impact Assessment SLA by Owners — Instantaneous Counts (Scalable, no hardcoding)
-- Uses rolling 90-day window from current date
-- Equivalent of: queries/aggregates/ImpactAssessmentOwnersSLAInstantaneous.js
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  o.owners AS ownerId,

  SUM(CASE WHEN a.impactStatus IN ('New', 'In Process')
           THEN 1
           ELSE 0 END) AS `open`,

  SUM(CASE WHEN a.impactStatus = 'Closed'
           THEN 1
           ELSE 0 END) AS `closed`

FROM `RegHub`.`mv_enriched_alerts` a

INNER JOIN `RegHub`.`mv_enriched_alerts_owners` o
  ON o._id = a._id

WHERE a.tenantId = '638f19922bd40da1fc9bd594'
  AND a.created >= NOW() - INTERVAL 90 DAY
  AND a.created <= NOW()
  AND a.impactStatus != 'No'

GROUP BY o.owners;
