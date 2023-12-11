import { regMapStatusCollection ,
	uniregCollection ,corpusCollection ,
	regSiteConfigCollection,juridictionsCollection,
	regSubscriptionCollection,regSubscriptionFeedCollection,mapGenericCollection,regSubscriptionRepoCollection,regSubscriptionJurisdictionCollection} from "./collections";
import { defaultTenantId } from "./cube-constants"

const feedId = '`feeds.feedId`';
const archivedFeed = '`feeds.archived`';

const RegSubscriptionFeedIds = 
			`(
				(SELECT _id ,tenantId from ${regSubscriptionCollection} ) as RegSubscriptions 
				INNER JOIN 
				(SELECT _id as Id , ${feedId} as feedId FROM ${regSubscriptionFeedCollection} WHERE  ${archivedFeed} = 0) as RegSubFeedIds
				ON RegSubscriptions._id = RegSubFeedIds.Id
			)`

const RegSubscriptionRepos = `(
				(SELECT _id, tenantId FROM ${regSubscriptionCollection} ) 
				AS RegSub INNER JOIN
				(SELECT _id , repos FROM ${regSubscriptionRepoCollection} )
				AS SubRepos ON SubRepos._id=RegSub._id
			)`;

const RegSubscrptionJurisdictions = `(
				SELECT _id, tenantId FROM ${regSubscriptionCollection}) AS RegSub 
				INNER JOIN
				(SELECT _id , jurisdictions as jurisdiction_ids FROM ${regSubscriptionJurisdictionCollection}) AS SubJurys
				ON SubJurys._id=RegSub._id`;

export const regMapStatusUniregJoin = 
	`(
		SELECT _id, srcObject, status, tenantId, GROUP_CONCAT(destObject) as mdIds FROM (
			SELECT _id , tenantId, srcObject,status FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.srcType = 'Regulation' AND ${regMapStatusCollection}.archived = 0
			) AS RegMapCube LEFT JOIN
			(SELECT destObject, srcObject as mdMapSrc FROM ${mapGenericCollection} WHERE ${mapGenericCollection}.srcType="Regulation"  AND ${mapGenericCollection}.destType="MD" AND ${mapGenericCollection}.archived=0)
			AS MDMap ON MDMap.mdMapSrc=RegMapCube.srcObject GROUP BY _id)
		AS RegMapStatusMDCube LEFT JOIN 
		(
			SELECT _id as uniregId , repo FROM ${uniregCollection}) AS UniRegCube 
			ON RegMapStatusMDCube.srcObject = UniRegCube.uniregId`

//Custom corpus
export const regMapStatusUniregJoinCC = 
	`(
		SELECT _id, srcObject, status, tenantId, GROUP_CONCAT(destObject) as mdIds FROM (
			SELECT _id , tenantId, srcObject,status FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.srcType = 'Regulation' AND ${regMapStatusCollection}.archived = 0
			) AS RegMapCube LEFT JOIN
			(SELECT destObject, srcObject as mdMapSrc FROM ${mapGenericCollection} WHERE ${mapGenericCollection}.srcType="Regulation" AND ${mapGenericCollection}.destType="MD" AND ${mapGenericCollection}.archived=0)
			AS MDMap ON MDMap.mdMapSrc=RegMapCube.srcObject GROUP BY _id)
		AS RegMapStatusMDCube LEFT JOIN 
		(
			SELECT _id as uniregId,repo,uid FROM ${uniregCollection} WHERE ${uniregCollection}.repo = 'CC'
		) AS UniRegCube 
		ON RegMapStatusMDCube.srcObject = UniRegCube.uniregId`

export const CorpusJurisdictionJoin = 
			`(
				(SELECT id, jurisdiction, tenantId FROM 
					(SELECT id, _id, jurisdiction FROM ${corpusCollection}) AS Corpus
					INNER JOIN
					(SELECT repos, tenantId FROM  ${RegSubscriptionRepos}) AS SubscribedRepos
					ON Corpus._id=SubscribedRepos.repos)AS CorpusCollectionCube
				LEFT JOIN 
					(SELECT jurisdictionId , displayName from ${juridictionsCollection})AS JurisdictionCollectionCube
				ON CorpusCollectionCube.jurisdiction = JurisdictionCollectionCube.jurisdictionId
			)`

export const RegSiteJurisdictionJoin = 
		`(
				(SELECT  regSiteUid, jurisdiction, tenantId FROM
					(SELECT _id, uid as regSiteUid, jurisdiction, tenantId from reg_site_config) AS Feeds 
					INNER JOIN
					(SELECT jurisdiction_ids, tenantId as tenant FROM ${RegSubscrptionJurisdictions}) AS SubJuryIds
					ON SubJuryIds.jurisdiction_ids=Feeds.jurisdiction AND SubJuryIds.tenant=Feeds.tenantId) AS RegSiteCube
				LEFT JOIN 
					(SELECT _id as jurisObjectId , displayName from ${juridictionsCollection}) AS JurisdictionCollectionCube
				ON RegSiteCube.jurisdiction = JurisdictionCollectionCube.jurisObjectId
			)`

const UserFeeds = 
	`(	
			(SELECT feedId,tenantId FROM ${RegSubscriptionFeedIds}) AS RegSubscribedFeedsCube
			INNER JOIN
			(SELECT _id ,jurisdiction , corpusType FROM ${regSiteConfigCollection} where tenantId = "${defaultTenantId}" and ${regSiteConfigCollection}.archived = 0) AS regSiteConfigCube		
				ON regSiteConfigCube._id  = RegSubscribedFeedsCube.feedId
	  )`

export const AggregateUserFeeds = 
		`(
		SELECT _id, tenantId ,jurisdiction , corpusType FROM ${UserFeeds} 
			UNION ALL 
		SELECT _id, tenantId ,jurisdiction ,corpusType FROM ${regSiteConfigCollection} WHERE tenantId != "${defaultTenantId}"
		and ${regSiteConfigCollection}.archived = 0) AS AggFeedCube`
