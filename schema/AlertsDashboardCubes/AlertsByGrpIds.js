import { alertsCollection, alertMDiDCollection } from "./collections";
import { PRE_AGG_REFRESH_KEY_TIME } from "./cube-constants";

cube(`AlertsByGrpIds`, {
	sql: ` SELECT _id, alertCategory, publishedDate, tenantId, status, jurisdiction, docStatus, GROUP_CONCAT(MDiD) as MDiD FROM (SELECT _id, publishedDate, tenantId, status, jurisdiction, \`info.docStatus\` as docStatus,alertCategory FROM ${alertsCollection} where ${alertsCollection}.archived=0) as alerts LEFT JOIN 
        (SELECT _id as masterId , \`mdInfo._id\` as MDiD FROM ${alertMDiDCollection}) as masterData ON alerts._id= masterData.masterId  GROUP BY _id`,

	sqlAlias: `AlGrpIdCube`,

	joins: {
		Jurisdiction: {
			relationship: `hasOne`,
			sql: `${CUBE.jurisdiction} = ${Jurisdiction.jurisdictionId}`,
		},
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	preAggregations: {
		alertsByJurisdictionMdRollUp: {
			sqlAlias: "alByJuDocMd",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				AlertsByGrpIds.introducedDocStatus,
				AlertsByGrpIds.originDocStatus,
				AlertsByGrpIds.secondBodyStatus,
				AlertsByGrpIds.sentForSignatureStatus,
				AlertsByGrpIds.diedStatus,
				AlertsByGrpIds.becameLawStatus,
				AlertsByGrpIds.statuteStatus,
				AlertsByGrpIds.regulationStatus,
				AlertsByGrpIds.ruleStatus,
				AlertsByGrpIds.proposedRuleStatus,
				AlertsByGrpIds.agencyUpdateStatus,
			],
			dimensions: [
				Tenants.tenantId,
				Jurisdiction.displayName,
				Jurisdiction.shortName,
				Jurisdiction.jurisdictionId,
				AlertsByGrpIds.alertCategory,
				AlertsByGrpIds.status,
				AlertsByGrpIds.MDiD,
			],
			timeDimension: AlertsByGrpIds.publishedDate,
			granularity: `day`,
			buildRangeStart: {
				sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
		},
	},

	measures: {
		count: {
			sql: `_id`,
			type: `count`,
			title: `Count`,
		},
		introducedDocStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Introduced'`,
				},
			],
		},
		originDocStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Passed Body of Origin'`,
				},
			],
		},
		secondBodyStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Passed Second Body'`,
				},
			],
		},
		sentForSignatureStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Sent for Signature'`,
				},
			],
		},
		diedStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Died'`,
				},
			],
		},
		becameLawStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Became Law'`,
				},
			],
		},
		statuteStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Statute'`,
				},
			],
		},
		regulationStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Regulation'`,
				},
			],
		},
		ruleStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Rule' AND ${CUBE}.alertCategory = 'Laws & Regulations'`,
				},
			],
		},
		proposedRuleStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.docStatus = 'Proposed Rule' AND ${CUBE}.alertCategory = 'Laws & Regulations'`,
				},
			],
		},
		agencyUpdateStatus: {
			sql: `docStatus`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.alertCategory = 'News & Publications'`,
				},
			],
		},
		totalBillsDocStatus: {
			sql: `${introducedDocStatus} + ${originDocStatus} + ${secondBodyStatus} + ${sentForSignatureStatus} + ${becameLawStatus} + ${diedStatus}`,
			type: `number`,
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
		},
		status: {
			sql: `${CUBE}.\`status\``,
			type: `string`,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
		publishedDate: {
			sql: `${CUBE}.\`publishedDate\``,
			type: `time`,
		},
		alertCategory: {
			sql: `${CUBE}.\`alertCategory\``,
			type: `string`,
			title: `Alert Category`,
		},
		docStatus: {
			sql: `${CUBE}.\`docStatus\``,
			type: `string`,
			title: `Doc Status`,
		},
		jurisdiction: {
			sql: `${CUBE}.\`jurisdiction\``,
			title: `juridiction`,
			type: `string`,
		},
		MDiD: {
			sql: `CONVERT(${CUBE}.\`MDiD\`,CHAR)`,
			type: `string`,
			title: `MDiD`,
		},
	},
});
