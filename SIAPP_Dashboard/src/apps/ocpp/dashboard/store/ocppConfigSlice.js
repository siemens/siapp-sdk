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

import {createSlice} from '@reduxjs/toolkit';
import _ from '@lodash';
import {cloneDeep} from 'lodash-es';
import serviceA8000 from '@A8000/utils/serviceA8000';
import {toast} from 'react-toastify';
import {optionsToast} from '@A8000/components/layout/AlertMessage';
import {addChangeStatus} from '@A8000/store/A8000/statusSlice';
import {getMqttStates} from '@A8000/store/A8000/mqtt/mqttDataSlice';
import {getOcppAllTypes} from './ocppTypicalsSlice';
import {Trans} from 'react-i18next';
import {configOcppCmd} from '@config/constA8000';
import {configRoles} from '@config/configAuth';

export const initOcpp = () => async (dispatch, getState) => {
	await dispatch(getOcppConfig());
	await dispatch(subscribeOcpp());
	await dispatch(getOcppAllTypes());
	return;
};

export const closeOcpp = () => async (dispatch, getState) => {
	await dispatch(resetOcppConfig());
	return;
};

export const getOcppConfig = () => async (dispatch, getState) => {
	const auth = getState().auth;
	let data = {};
	let fileName = configOcppCmd.filenameOcpp;
	if (_.intersection(configRoles['admin'], auth.roles).length > 0) fileName = configOcppCmd.filenameOcppAdmin;

	try {
		data = await dispatch(serviceA8000.readA8000(fileName));
	} catch (error) {
		data = {};
	}
	return dispatch(setOcppConfig(data));
};

export const subscribeOcpp = () => async (dispatch, getState) => {
	const {graph} = getState().A8000.mqtt.graphMqtt;
	const {control} = getState().A8000.mqtt.graphMqtt;
	const {configOcpp} = getState().ocpp;
	const allTopics = [];
	graph.forEach((item) => {
		if (item.group === 'stationOCPP') {
			configOcpp.config.stationsOCPP.forEach((station) => {
				const newTopic = '/' + station.meta.id + item.topic;
				allTopics.push({topic: newTopic});
			});
		}
	});
	control.forEach((item) => {
		if (item.group === 'stationOCPP') {
			configOcpp.config.stationsOCPP.forEach((station) => {
				const newTopic = '/' + station.meta.id + item.topic;
				allTopics.push({topic: newTopic});
			});
		}
	});
	dispatch(serviceA8000.subscribeMqtt(allTopics));
	return dispatch(getMqttStates());
};

export const updateOcppConfig = (newConfig) => async (dispatch, getState) => {
	newConfig.meta.loaded = false;
	newConfig.meta.lastModified = Date.now();
	dispatch(addChangeStatus('OCPP'));
	return dispatch(setOcppConfig(newConfig));
};

export const setOcppConfigKey = (stationId, stationData) => async (dispatch, getState) => {
	const {configOcpp} = getState().ocpp;
	let newConfig = cloneDeep(configOcpp);
	if (stationId === undefined || stationId === '') {
		const newStationData = _.merge(newConfig.config.generalOCPP, stationData);
		newConfig.config.generalOCPP = newStationData;
		dispatch(updateOcppConfig(newConfig));
	} else {
		const newStationData = _.merge(newConfig.config.stationsOCPP[stationId], stationData);
		newConfig.config.stationsOCPP[stationId] = newStationData;
		dispatch(updateOcppConfig(newConfig));
	}
	return;
};

export const saveOcppConfig = (loaded) => async (dispatch, getState) => {
	const {configOcpp} = getState().ocpp;
	let newConfig = cloneDeep(configOcpp);
	loaded ? (newConfig.meta.loaded = loaded) : (newConfig.meta.loaded = false);
	newConfig.meta.lastModified = Date.now();
	dispatch(setOcppConfig(newConfig));
	try {
		await dispatch(serviceA8000.writeA8000(configOcppCmd.filenameOcppAdmin, newConfig));
		toast.success(<Trans i18nKey='alert.successUpdate'>"Update successfully!"</Trans>, optionsToast);
		return dispatch(writeUserConfig(newConfig));
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorUpdate'>"Update failed!"</Trans>, optionsToast);
		return;
	}
};

export const writeUserConfig = (newConfig) => async (dispatch, getState) => {
	let userConfig = {
		config: {
			generalOCPP: {},
			stationsOCPP: [],
		},
	};

	userConfig.config.generalOCPP.meta = newConfig.config.generalOCPP.meta;
	newConfig.config.stationsOCPP.forEach((station, idStation) => {
		userConfig.config.stationsOCPP[idStation] = {meta: station.meta};
	});

	try {
		await dispatch(serviceA8000.writeA8000(configOcppCmd.filenameOcpp, userConfig));
		toast.success(<Trans i18nKey='alert.successUpdate'>"Update successfully!"</Trans>, optionsToast);
		return;
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorUpdate'>"Update failed!"</Trans>, optionsToast);
		return;
	}
};

export const deleteStation = (id) => async (dispatch, getState) => {
	const {configOcpp} = getState().ocpp;
	let newConfig = cloneDeep(configOcpp);
	newConfig.config.stationsOCPP.splice(id, 1);
	return dispatch(updateOcppConfig(newConfig));
};

export const addStation = (typeId, csId) => async (dispatch, getState) => {
	const {configOcpp, typicalsOcpp} = getState().ocpp;

	let newStation = {};
	typicalsOcpp.stationsOCPP[typeId].userParameters.forEach((parameter) => {
		newStation[parameter.key] = parameter.defaultValue;
	});
	newStation.meta = cloneDeep(typicalsOcpp.stationsOCPP[typeId].meta);
	newStation.meta.id = csId;

	let newConfig = cloneDeep(configOcpp);
	newConfig.config.stationsOCPP.push(newStation);
	return dispatch(updateOcppConfig(newConfig));
};

export const changeController = (typeId, keepValues) => async (dispatch, getState) => {
	const {configOcpp, typicalsOcpp} = getState().ocpp;

	let newController = {};
	typicalsOcpp.generalOCPP[typeId].userParameters.forEach((parameter) => {
		newController[parameter.key] = parameter.defaultValue;
	});
	newController.meta = cloneDeep(typicalsOcpp.generalOCPP[typeId].meta);
	newController.meta.id = typicalsOcpp.generalOCPP[typeId].meta.displayName;

	let newConfig = cloneDeep(configOcpp);
	newConfig.config.generalOCPP = newController;
	if (keepValues === true) {
		Object.keys(newConfig.config.generalOCPP).forEach((parameter) => {
			if (parameter !== 'meta' && configOcpp.config.generalOCPP[parameter] !== undefined) {
				newConfig.config.generalOCPP[parameter] = configOcpp.config.generalOCPP[parameter];
			}
		});
	}
	return dispatch(updateOcppConfig(newConfig));
};

const initialState = {
	state: null,
};

const ocppConfigSlice = createSlice({
	name: 'ocpp/configOcpp',
	initialState,
	reducers: {
		setOcppConfig: (state, action) => action.payload,
		resetOcppConfig: (state, action) => {
			return initialState;
		},
	},
});

export const {resetOcppConfig, setOcppConfig} = ocppConfigSlice.actions;

export default ocppConfigSlice.reducer;
