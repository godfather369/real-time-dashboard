const regHubDataBase = "RegHub";

export const userCollection = getCollectionString("users");
export const groupsOfUserCollection = getCollectionString(
	"users_functionalRole"
);
export const tenantCollection = getCollectionString("tenants");
export const alertsCollection = getCollectionString("reg_alert_parents");
export const agenciesCollection = getCollectionString("reg_agencies");
export const agencyMapCollection = getCollectionString(
	"reg_alert_parents_agencyMap"
);
export const agencyNamesCollection = getCollectionString(
	"reg_alert_parents_agencyNames"
);
export const alertsUsersCollection = getCollectionString(
	"reg_alert_parents_owners"
);
export const alertMDIDCollection = getCollectionString(
	"reg_alert_parents_mdInfo"
);
export const alertsMetaCollection = getCollectionString("alerts_meta");
export const juridictionsCollection = getCollectionString("reg_jurisdictions");
export const enforcementActionsCollection =
	getCollectionString("reg_ea_alerts");
export const enforcementActionsAgencyMapCollection = getCollectionString(
	"reg_ea_alerts_agencyMap"
);
export const corpusCollection = getCollectionString("reg_corpus");
export const harmonizedActionCollection = getCollectionString(
	"reg_ea_alerts_info_harmonizedActionType"
);
export const regulationsCollection = getCollectionString(
	"reg_ea_alerts_info_regulations"
);
export const regConfigCollection = getCollectionString("reg_config");
export const regMapGenericCollection = getCollectionString("reg_map_generic");
export const regMapStatusCollection = getCollectionString("reg_map_status");
export const risksCollection = getCollectionString("risks");
export const requirementsCollection = getCollectionString("reqs");
export const tasksCollection = getCollectionString("tasks");
export const tasksOwnersCollection = getCollectionString("tasks_owners");
export const tasksGroupsCollection = getCollectionString("tasks_groups");
export const controlsCollection = getCollectionString("controls");
export const alertsByStatusCollection = getCollectionString(
	"reg_config_status_regChange"
);
export const risksByStatusCollection = getCollectionString(
	"reg_config_status_risk"
);
export const tasksByStatusCollection = getCollectionString(
	"reg_config_status_task"
);
export const requirementsByStatusCollection = getCollectionString(
	"reg_config_status_requirement"
);
export const controlByStatusCollection = getCollectionString(
	"reg_config_status_control"
);
export const mapUserCollection = getCollectionString("reg_map_user");
export const impactAssessmentCollection =
	getCollectionString("reg_assessments");
export const impactAssessmentGroupsCollection = getCollectionString(
	"reg_assessments_groups"
);
export const impactAssessmentOwnersCollection = getCollectionString(
	"reg_assessments_owners"
);
export const impactAssessmentImpactedTeamCollection = getCollectionString(
	"reg_assessments_customAttributes_I_E_F_IMPACTED_TEAM"
);
export const impactAssessmentImpactLevelCollection = getCollectionString(
	"reg_config_impactAssessment_extensions_fields_IMPACT_LEVEL_allowed_values"
);
export const impactAssessmentImpactedTeamAllowedValuesCollection =
	getCollectionString(
		"reg_config_impactAssessment_extensions_fields_I_E_F_IMPACTED_TEAM_allowed_values"
	);
export const groupCollection = getCollectionString("reg_groups");
export const alertsGroupsCollection = getCollectionString(
	"reg_alert_parents_groups"
);

export const mapGenericCollection = getCollectionString("reg_map_generic");
export const masterDatumCollection = getCollectionString("masterdatum");
export const masterDatumMetaCollection = getCollectionString(
	"masterdatum_meta_masterdata"
);
export const uniregCollection = getCollectionString("unireg");
export const uniregLineageCollection = getCollectionString("unireg_lineage");
export const regSiteConfigCollection = getCollectionString("reg_site_config");
export const regSubscriptionCollection =
	getCollectionString("reg_subscriptions");
export const regSubscriptionFeedCollection = getCollectionString(
	"reg_subscriptions_feeds"
);
export const regSubscriptionRepoCollection = getCollectionString(
	"reg_subscriptions_repos"
);
export const regSubscriptionJurisdictionCollection = getCollectionString(
	"reg_subscriptions_jurisdictions"
);

function getCollectionString(collectionName) {
	return `\`${regHubDataBase}\`.\`${collectionName}\``;
}
