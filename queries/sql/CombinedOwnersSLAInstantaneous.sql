-- ═══════════════════════════════════════════════════════════════════════════════
-- Combined Owners SLA — Instantaneous Counts (Scalable, no hardcoding)
-- Crosses alert status (isTerminal) with impact status for full SLA breakdown
-- Uses rolling 90-day window from current date
-- Equivalent of: queries/aggregates/CombinedOwnersSLAInstantaneous.js
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  o.owners AS ownerId,

  SUM(CASE WHEN sc.isTerminal = 0 AND a.impactStatus IN ('New', 'In Process')
           THEN 1 ELSE 0 END) AS `openOpen`,

  SUM(CASE WHEN sc.isTerminal = 0 AND a.impactStatus = 'Closed'
           THEN 1 ELSE 0 END) AS `openClosed`,

  SUM(CASE WHEN sc.isTerminal = 0 AND a.impactStatus = 'No'
           THEN 1 ELSE 0 END) AS `openMissing`,

  SUM(CASE WHEN sc.isTerminal = 1 AND a.impactStatus IN ('New', 'In Process')
           THEN 1 ELSE 0 END) AS `closedOpen`,

  SUM(CASE WHEN sc.isTerminal = 1 AND a.impactStatus = 'Closed'
           THEN 1 ELSE 0 END) AS `closedClosed`,

  SUM(CASE WHEN sc.isTerminal = 1 AND a.impactStatus = 'No'
           THEN 1 ELSE 0 END) AS `closedMissing`,

  SUM(CASE WHEN sc.isTerminal = 0
           THEN 1 ELSE 0 END) AS `open`,

  SUM(CASE WHEN sc.isTerminal = 1
           THEN 1 ELSE 0 END) AS `closed`

FROM `RegHub`.`mv_enriched_alerts` a

INNER JOIN `RegHub`.`mv_enriched_alerts_owners` o
  ON o._id = a._id

INNER JOIN (
  SELECT
    `_id` AS configId,
    `status.regChange.id` AS statusId,
    `status.regChange.isTerminal` AS isTerminal
  FROM `RegHub`.`reg_config_status_regChange`
  WHERE `status.regChange.active` = 1
    AND `_id` IN (
      SELECT _id FROM `RegHub`.`reg_config`
      WHERE tenantId = '638f19922bd40da1fc9bd594'
    )
) AS sc
  ON sc.statusId = a.status

WHERE a.tenantId = '638f19922bd40da1fc9bd594'
  AND a.created >= NOW() - INTERVAL 90 DAY
  AND a.created <= NOW()

GROUP BY o.owners;
