import { regMapStatusCollection ,
	uniregCollection ,corpusCollection ,
	regSiteConfigCollection,juridictionsCollection,
	regSubscriptionCollection,regSubscriptionFeedCollection} from "./collections";
import {defaultTenantId} from "./cube-constants"

export const regMapStatusUniregJoin = 
				`(
					SELECT _id , tenantId, srcObject,status FROM ${regMapStatusCollection} 
						WHERE ${regMapStatusCollection}.srcType = 'Regulation'
						AND ${regMapStatusCollection}.archived = 0
					) as RegMapStatusCube 
					LEFT JOIN 
					(
						SELECT _id as uniregId , repo FROM ${uniregCollection}) AS UniRegCube 
						ON RegMapStatusCube.srcObject = UniRegCube.uniregId`

//Custom corpus
export const regMapStatusUniregJoinCC = 
			`(
				SELECT _id , tenantId, srcObject,status FROM ${regMapStatusCollection} 
					WHERE ${regMapStatusCollection}.srcType = 'Regulation'
					AND ${regMapStatusCollection}.archived = 0
			) as RegMapStatusCube 
			LEFT JOIN 
			(
				SELECT _id as uniregId,repo,uid FROM ${uniregCollection} WHERE ${uniregCollection}.repo = 'CC'
			) AS UniRegCube 
			ON RegMapStatusCube.srcObject = UniRegCube.uniregId`

export const CorpusJurisdictionJoin = 
			`(
				(SELECT id, jurisdiction from ${corpusCollection})AS CorpusCollectionCube
				LEFT JOIN 
					(SELECT jurisdictionId , displayName from ${juridictionsCollection})AS JurisdictionCollectionCube
				ON CorpusCollectionCube.jurisdiction = JurisdictionCollectionCube.jurisdictionId
			)`

export const RegSiteJurisdictionJoin = 
		`(
				(SELECT uid as regSiteUid, jurisdiction from ${regSiteConfigCollection})AS RegSiteCube
				LEFT JOIN 
					(SELECT _id as jurisObjectId , displayName from ${juridictionsCollection})AS JurisdictionCollectionCube
				ON RegSiteCube.jurisdiction = JurisdictionCollectionCube.jurisObjectId)
			)`

const feedId = '`feeds.feedId`';
const archivedFeed = '`feeds.archived`';

const RegSubscriptionFeedIds = 
			`(
				(SELECT _id ,tenantId from ${regSubscriptionCollection} ) as RegSubscriptions 
				INNER JOIN 
				(SELECT _id as Id , ${feedId} as feedId FROM ${regSubscriptionFeedCollection} WHERE  ${archivedFeed} = 0) as RegSubFeedIds
				ON RegSubscriptions._id = RegSubFeedIds.Id
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