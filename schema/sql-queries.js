import {
	alertsCollection,
	regMapStatusCollection,
	uniregCollection,
	corpusCollection,
	regSiteConfigCollection,
	juridictionsCollection,
	regSubscriptionCollection,
	regSubscriptionFeedCollection,
	mapGenericCollection,
	regSubscriptionRepoCollection,
	regSubscriptionJurisdictionCollection,
} from "./collections";
import { defaultTenantId } from "./cube-constants";

export const alertsActiveFilterSql = `${alertsCollection}.archived = 0 AND (${alertsCollection}.\`reggi.validity\` != 0 OR ${alertsCollection}.\`reggi.validity\` IS NULL)`;

export const alertsActiveFilterSqlUnqualified = `archived = 0 AND (\`reggi.validity\` != 0 OR \`reggi.validity\` IS NULL)`;

const feedId = "`feeds.feedId`";
const archivedFeed = "`feeds.archived`";

const RegSubscriptionFeedIds = `
	${regSubscriptionCollection} AS RegSubscriptions
	INNER JOIN (
		SELECT _id AS Id, ${feedId} AS feedId
		FROM ${regSubscriptionFeedCollection}
		WHERE ${archivedFeed} = 0
	) AS RegSubFeedIds
		ON RegSubscriptions._id = RegSubFeedIds.Id
`;

const RegSubscriptionRepos = `
	${regSubscriptionCollection} AS RegSub
	INNER JOIN ${regSubscriptionRepoCollection} AS SubRepos
		ON SubRepos._id = RegSub._id
`;

const RegSubscrptionJurisdictions = `
	${regSubscriptionCollection} AS RegSub
	INNER JOIN (
		SELECT _id, jurisdictions AS jurisdiction_ids
		FROM ${regSubscriptionJurisdictionCollection}
	) AS SubJurys
		ON SubJurys._id = RegSub._id
`;

const regMapStatusUniregJoinCore = (uniregCubeSql) => `
	(
		SELECT RegMapCube._id, RegMapCube.srcObject, RegMapCube.status, RegMapCube.tenantId, GROUP_CONCAT(MDMap.destObject) AS mdIds
		FROM (
			SELECT _id, tenantId, srcObject, status
			FROM ${regMapStatusCollection}
			WHERE ${regMapStatusCollection}.srcType = 'Regulation'
				AND ${regMapStatusCollection}.archived = 0
		) AS RegMapCube
		LEFT JOIN (
			SELECT destObject, srcObject AS mdMapSrc
			FROM ${mapGenericCollection}
			WHERE ${mapGenericCollection}.srcType = "Regulation"
				AND ${mapGenericCollection}.destType = "MD"
				AND ${mapGenericCollection}.archived = 0
		) AS MDMap
			ON MDMap.mdMapSrc = RegMapCube.srcObject
		GROUP BY RegMapCube._id
	) AS RegMapMD
	LEFT JOIN
	${uniregCubeSql}
	ON RegMapMD.srcObject = UniRegCube.uniregId
`;

export const regMapStatusUniregJoin = regMapStatusUniregJoinCore(`	(
		SELECT _id AS uniregId, repo 
		FROM ${uniregCollection}
	) AS UniRegCube`);

// Custom corpus: restrict unireg to CC and expose uid for reg-site jurisdiction join
export const regMapStatusUniregJoinCC = regMapStatusUniregJoinCore(`	(
		SELECT _id AS uniregId, repo, uid 
		FROM ${uniregCollection} 
		WHERE ${uniregCollection}.repo = 'CC'
	) AS UniRegCube`);

export const CorpusJurisdictionJoin = `
	(
		(
			SELECT Corpus.id, Corpus.jurisdiction, SubscribedRepos.tenantId
			FROM ${corpusCollection} AS Corpus
			INNER JOIN (
				SELECT repos, tenantId
				FROM ${RegSubscriptionRepos}
			) AS SubscribedRepos
				ON Corpus._id = SubscribedRepos.repos
		) AS CorpusCube
		LEFT JOIN (
			SELECT jurisdictionId, displayName
			FROM ${juridictionsCollection}
		) AS JurisCube
			ON CorpusCube.jurisdiction = JurisCube.jurisdictionId
	)
`;

export const RegSiteJurisdictionJoin = `
	(
		(
			SELECT Feeds.uid AS regSiteUid, Feeds.jurisdiction, Feeds.tenantId
			FROM reg_site_config AS Feeds
			INNER JOIN (
				SELECT jurisdiction_ids, tenantId AS tenant
				FROM ${RegSubscrptionJurisdictions}
			) AS SubJuryIds
				ON SubJuryIds.jurisdiction_ids = Feeds.jurisdiction
				AND SubJuryIds.tenant = Feeds.tenantId
		) AS RegSiteCube
		LEFT JOIN (
			SELECT _id AS jurisObjectId, displayName
			FROM ${juridictionsCollection}
		) AS JurisCube
			ON RegSiteCube.jurisdiction = JurisCube.jurisObjectId
	)
`;

const UserFeeds = `
	(
		(
			SELECT feedId, tenantId
			FROM ${RegSubscriptionFeedIds}
		) AS SubFeeds
		INNER JOIN (
			SELECT _id, jurisdiction, corpusType
			FROM ${regSiteConfigCollection}
			WHERE tenantId = "${defaultTenantId}"
				AND ${regSiteConfigCollection}.archived = 0
		) AS regSiteConfigCube
			ON regSiteConfigCube._id = SubFeeds.feedId
	)
`;

export const AggregateUserFeeds = `
	(
		SELECT _id, tenantId, jurisdiction, corpusType 
		FROM ${UserFeeds} 
		UNION ALL 
		SELECT _id, tenantId, jurisdiction, corpusType 
		FROM ${regSiteConfigCollection} 
		WHERE tenantId != "${defaultTenantId}"
			AND ${regSiteConfigCollection}.archived = 0
	) AS AggFeedCube
`;
