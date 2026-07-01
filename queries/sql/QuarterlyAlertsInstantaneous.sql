-- ═══════════════════════════════════════════════════════════════════════════════
-- Quarterly Alerts — Instantaneous Counts (Scalable, no hardcoding)
-- Uses reg_config_status_regChange filtered by tenant's configId via subquery
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  SUM(CASE WHEN sc.isFollowing = 1 AND sc.isExcluded != 1
           THEN 1 ELSE 0 END) AS `following`,

  SUM(CASE WHEN sc.isTerminal = 0 AND sc.isExcluded != 1
           THEN 1 ELSE 0 END) AS `open`,

  SUM(CASE WHEN sc.actionRequired = 1 AND sc.isTerminal = 1 AND sc.isExcluded != 1
           THEN 1 ELSE 0 END) AS `applicable`,

  SUM(CASE WHEN sc.isExcluded = 1
           THEN 1 ELSE 0 END) AS `excluded`,

  SUM(CASE WHEN a.impactLevel = 'CB - N/A'
            AND sc.isExcluded != 1
            AND (sc.isTerminal = 1 OR sc.isFollowing = 1)
           THEN 1 ELSE 0 END) AS `potentialImp`

FROM `RegHub`.`mv_enriched_alerts` a

INNER JOIN (
  SELECT
    `_id` AS configId,
    `status.regChange.id` AS statusId,
    `status.regChange.isTerminal` AS isTerminal,
    `status.regChange.isExcluded` AS isExcluded,
    `status.regChange.actionRequired` AS actionRequired,
    `status.regChange.meta.isFollowing` AS isFollowing
  FROM `RegHub`.`reg_config_status_regChange`
  WHERE `status.regChange.active` = 1
    AND `_id` IN (
      SELECT _id FROM `RegHub`.`reg_config`
      WHERE tenantId = '638f19922bd40da1fc9bd594'
    )
) AS sc
  ON sc.statusId = a.status

WHERE a.tenantId = '638f19922bd40da1fc9bd594'
  AND a.created >= '2026-04-01 00:00:00'
  AND a.created <  '2026-07-01 00:00:00';
