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

import moment from 'moment';
import _ from '@lodash';
import {createSlice} from '@reduxjs/toolkit';
import serviceA8000 from '@A8000/utils/serviceA8000';
import {constApiA8000} from '@config/constA8000';
import {initTopicsMqtt} from './mqttTopicsSlice';
import {initMqttGraph} from './mqttGraphSlice';
import {setUpdate} from '../statusSlice';
import {checkExpireTime} from '@A8000/store/authSlice';
import ModelMqttMessage from '@A8000/models/ModelMqttMessage';

export const initMqtt = () => async (dispatch, getState) => {
	const weblog = 'weblog';
	await dispatch(serviceA8000.subscribeMqtt([{topic: weblog}]));

	const mqttData = {
		topic: weblog,
		message: {
			dataType: 'string',
			value: moment().valueOf(),
			meta: {name: weblog},
		},
	};

	const message = ModelMqttMessage(mqttData);
	await dispatch(setDataByTopic(message));

	await dispatch(initTopicsMqtt());
	await dispatch(initMqttGraph());
	await dispatch(getMqttStates());
	return;
};

export const closeMqtt = () => async (dispatch, getState) => {
	await dispatch(resetMqttData());
	return;
};

export const getMqttStates = () => async (dispatch, getState) => {
	let payload = {};
	dispatch(checkExpireTime());

	const data = [];
	try {
		const dataApi = await dispatch(serviceA8000.getA8000(constApiA8000.urlMqttStates, payload));
		dataApi.forEach((item) => {
			data.push({id: item.topic, value: item.message.value, timestamp: item.message.timestamp});
		});
		dispatch(setUpdate(moment().valueOf()));
		return dispatch(setMqttData(data));
	} catch (error) {
		console.log(error);
	}
	return;
};

export const getArchiveByTopic = (topic, fromTime, toTime) => async (dispatch, getState) => {
	const {dataMqtt} = getState().A8000.mqtt;
	const currentData = _.find(dataMqtt, {id: topic});

	let topicValue = 0;
	if (currentData !== undefined && currentData.value !== undefined) topicValue = currentData.value.toFixed(3);
	if (fromTime === undefined || toTime === undefined) {
		fromTime = moment().valueOf();
		toTime = fromTime;
	}
	let payload = {
		topic,
	};

	if (fromTime !== toTime) {
		payload = {
			topic,
			from: fromTime,
			to: toTime,
		};
	}

	const topicData = [];
	try {
		const dataApi = await dispatch(serviceA8000.getA8000(constApiA8000.urlData, payload));
		if (dataApi.length > 0) {
			dataApi
				.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1))
				.forEach((item, idItem) => {
					if (item.topic === topic && item.timestamp !== undefined && item.value !== undefined) {
						if (
							typeof item.topic === 'string' &&
							typeof item.timestamp === 'number' &&
							typeof item.value === 'number'
						) {
							if (item.timestamp >= fromTime && item.timestamp <= toTime) {
								if (idItem === 0) topicData.push([fromTime, item.value.toFixed(3)]);
								if (item.timestamp > fromTime) {
									topicData.push([item.timestamp, item.value.toFixed(3)]);
								} else {
									topicData.splice(0, 1, [fromTime, item.value.toFixed(3)]);
								}
							}
						}
					}
				});
		}
		if (topicData.length === 0) topicData.push([fromTime - 60000, topicValue]);
		topicData.push([toTime, topicValue]);
	} catch (error) {
		console.log(error);
	}
	return topicData;
};

export const setDataByTopic = (payload) => async (dispatch, getState) => {
	try {
		await dispatch(serviceA8000.setA8000(constApiA8000.urlMqttPub, payload));
		setTimeout(() => {
			dispatch(getMqttStates());
		}, 100);
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
};

const initialState = {
	state: null,
};

const mqttDataSlice = createSlice({
	name: 'A8000/mqtt/dataMqtt',
	initialState,
	reducers: {
		setMqttData: (state, action) => {
			return action.payload;
		},
		resetMqttData: (state, action) => {
			return initialState;
		},
	},
});

export const {resetMqttData, setMqttData} = mqttDataSlice.actions;

export default mqttDataSlice.reducer;
