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
import _ from '@lodash';
import {initMqtt} from '@A8000/store/A8000/mqtt/mqttDataSlice';
import {saveTopicsMqtt} from '@A8000/store/A8000/mqtt/mqttTopicsSlice';
import {initSimu} from '@A8000/store/A8000/simuSlice';
import {initOcpp, saveOcppConfig} from 'apps/ocpp/dashboard/store/ocppConfigSlice';
import {setLoading} from '@A8000/store/A8000/statusSlice';
import {saveMqttGraph} from '@A8000/store/A8000/mqtt/mqttGraphSlice';
import {removeChangeStatus} from '@A8000/store/A8000/statusSlice';
import {configRoles} from './configAuth';
import {configFunctionBlock, defaultsSIAPP} from '@config/configLinks';
import {closeSimu} from '@A8000/store/A8000/simuSlice';
import {closeOcpp} from 'apps/ocpp/dashboard/store/ocppConfigSlice';
import {closeMqtt} from '@A8000/store/A8000/mqtt/mqttDataSlice';
import {fileList} from '@A8000/store/A8000/fileSlice';
import {initFileSystem} from '@A8000/store/A8000/fileSlice';
import {authSIAPP} from '@A8000/store/authSlice';

export const initA8000 = () => async (dispatch, getState) => {
	const auth = getState().auth;
	dispatch(setLoading(true));
	setTimeout(() => {
		dispatch(setLoading(false));
	}, 5000);

	// SIAPP configuration
	defaultsSIAPP.forEach((item) => {
		const siappID = auth.siappName.toUpperCase().replace('-DEV', '');
		if (item.id === siappID) {
			dispatch(authSIAPP(item));
		}
	});

	// filesystem
	if (_.intersection(configRoles['admin'], auth.roles).length > 0) {
		await dispatch(fileList());
	}

	// insert init functions in correct order
	await dispatch(initMqtt());

	//OCPP ?
	if (configFunctionBlock['ocpp'].indexOf(auth.siappName.toUpperCase())) await dispatch(initOcpp());

	await dispatch(initSimu());

	dispatch(setLoading(false));
};

export const closeA8000 = () => async (dispatch, getState) => {
	const auth = getState().auth;
	dispatch(setLoading(true));
	setTimeout(() => {
		dispatch(setLoading(false));
	}, 5000);

	// filesystem
	await dispatch(initFileSystem());

	// insert init functions in correct order
	await dispatch(closeMqtt());

	//OCPP ?
	if (configFunctionBlock['ocpp'].indexOf(auth.siappName.toUpperCase())) await dispatch(closeOcpp());

	await dispatch(closeSimu());

	dispatch(setLoading(false));
};

export const saveA8000 = () => async (dispatch, getState) => {
	const status = getState().A8000.status;

	// insert save functions
	const saveFunctions = [
		{
			id: 'OCPP',
			call: function () {
				dispatch(saveOcppConfig(false));
			},
		},
		{
			id: 'graphMQTT',
			call: function () {
				dispatch(saveMqttGraph());
			},
		},
		{
			id: 'topicsMQTT',
			call: function () {
				dispatch(saveTopicsMqtt());
			},
		},
	];

	status.save.forEach((item) => {
		const saveInfo = _.find(saveFunctions, {id: item});
		if (saveInfo !== undefined) {
			saveInfo.call();
		}
		dispatch(removeChangeStatus(item));
	});
};
