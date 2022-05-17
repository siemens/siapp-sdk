/*
 * SIAPP DEMO SPA (Single Page Application)
 *
 * SPDX-License-Identifier: MIT
 * Copyright 2021 - 2022 Siemens AG
 *
 * Authors:
 *   Peter Stern <stern.peter@siemens.com>
 *
 */

export const constApiA8000 = {
	urlAuth: '/auth',
	urlCmd: '/cmd',
	urlData: '/signals',
	urlMqttSub: '/mqtt_subscribe_topic',
	urlMqttPub: '/mqtt_publish',
	urlMqttUlist: '/mqtt_publish_ulist',
	urlMqttStates: '/mqtt_current_states',
	urlFileRead: '/read_file',
	urlFileWrite: '/write_file',
	urlFileImport: '/import_file',
	urlFileExport: '/export_file',
	urlFileDir: '/list_dir_json',
	urlFileMkDir: '/mkdir',
	urlFileDel: '/delete',
	filenameMqtt: 'admin/configuration/mqtt_ulist.json',
	filenameMqttGraph: 'configuration/mqtt_webconfig.json',
	filenameWebOSS: '/Readme_OSS_SIAPP_Dashboard.html',
	filenameSiappOSS: 'Readme_OSS.html',
};

export const configMqttSimCmd = {
	cmdMqttSimReload: '/cmd/mqttSim/reload',
	cmdMqttSimGetStatus: '/cmd/mqttSim/getStatus',
	cmdMqttSimPause: '/cmd/mqttSim/pause',
	cmdMqttSimResume: '/cmd/mqttSim/resume',
	cmdMqttSimFilePath: '/persist_data/test/test.csv',
};

export const configOcppCmd = {
	filenameOcppAdmin: 'admin/configuration/ocpp_uconfig.json',
	filenameOcpp: 'configuration/ocpp_uconfig.json',
	cmdGetOcppTypicals: '/cmd/ocppBoot/getType',
	cmdGetOcppType: '/cmd/ocppBoot/getTypePar',
	cmdSetOcppReload: '/cmd/ocppBoot/reload',
	cmdGetOcppStatus: '/cmd/ocppBoot/getStatus',
	folderGeneralOCPP: 'templates/lc/',
	folderStationsOCPP: 'templates/station/',
};

export const inputTypes = {
	number: 'number',
	boolean: 'checkbox',
	string: 'text',
	float: 'number',
	int: 'number',
};
