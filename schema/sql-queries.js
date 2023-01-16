import { regMapStatusCollection ,
	uniregCollection ,corpusCollection ,
	regSiteConfigCollection,juridictionsCollection} from "./collections";

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