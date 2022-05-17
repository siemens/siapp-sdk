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

import {cloneDeep} from 'lodash-es';
import {createSlice} from '@reduxjs/toolkit';
import serviceA8000 from '@A8000/utils/serviceA8000';
import {constApiA8000} from '@config/constA8000';
import {toast} from 'react-toastify';
import {optionsToast} from '@A8000/components/layout/AlertMessage';
import {addChangeStatus} from '@A8000/store/A8000/statusSlice';
import {getMqttStates} from './mqttDataSlice';
import ModelMqttMessage from '@A8000/models/ModelMqttMessage';
import {Trans} from 'react-i18next';

export const initTopicsMqtt = () => async (dispatch, getState) => {
	let data = {};
	try {
		data = await dispatch(serviceA8000.readA8000(constApiA8000.filenameMqtt));
	} catch (error) {
		data = {};
	}
	if (data.publishMQTT !== undefined) {
		await dispatch(setTopicsMqtt(data.publishMQTT));
		await dispatch(subscribeTopicsMqtt());
	}
};

export const subscribeTopicsMqtt = () => async (dispatch, getState) => {
	const {topicsMqtt} = getState().A8000.mqtt;
	const allTopics = [];
	topicsMqtt.forEach((item) => {
		allTopics.push({topic: item.topic});
	});
	dispatch(serviceA8000.subscribeMqtt(allTopics));
	return;
};

export const updateTopicsMqtt = (topicsMqtt) => async (dispatch, getState) => {
	dispatch(addChangeStatus('topicsMQTT'));
	return dispatch(setTopicsMqtt(topicsMqtt));
};

export const saveTopicsMqtt = () => async (dispatch, getState) => {
	const {topicsMqtt} = getState().A8000.mqtt;
	try {
		await dispatch(serviceA8000.writeA8000(constApiA8000.filenameMqtt, {publishMQTT: topicsMqtt}));
		await dispatch(subscribeTopicsMqtt());
		await dispatch(serviceA8000.setA8000(constApiA8000.urlMqttUlist, {}));
		await dispatch(getMqttStates());
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorUpdate'>"Update failed!"</Trans>, optionsToast);
	}
	return;
};

export const deleteTopicsMqtt = (id) => async (dispatch, getState) => {
	const {mqtt} = getState().A8000;
	const newTopicsMqtt = cloneDeep(mqtt.topicsMqtt);
	newTopicsMqtt.splice(id, 1);
	return dispatch(updateTopicsMqtt(newTopicsMqtt));
};

export const addTopicsMqtt = (data) => async (dispatch, getState) => {
	const {mqtt} = getState().A8000;
	const mqttData = {
		topic: data.topic,
		message: {
			dataType: data.type,
			value: data.value,
			meta: {name: data.topic},
		},
	};
	const newTopicsMqtt = cloneDeep(mqtt.topicsMqtt);
	const newTopic = ModelMqttMessage(mqttData);
	newTopicsMqtt.push(newTopic);
	return dispatch(updateTopicsMqtt(newTopicsMqtt));
};

export const editTopicsMqtt = (data, id) => async (dispatch, getState) => {
	const {mqtt} = getState().A8000;
	const mqttData = {
		topic: data.topic,
		message: {
			dataType: data.type,
			value: data.value,
			meta: {name: data.topic},
		},
	};

	let newTopicsMqtt = cloneDeep(mqtt.topicsMqtt);
	newTopicsMqtt[id] = ModelMqttMessage(mqttData);
	return dispatch(updateTopicsMqtt(newTopicsMqtt));
};

const initialState = [];

const mqttTopicsSlice = createSlice({
	name: 'A8000/mqtt/topicsMqtt',
	initialState,
	reducers: {
		setTopicsMqtt: (state, action) => action.payload,
		resetTopicsMqtt: (state, action) => {
			return initialState;
		},
	},
});

export const {setTopicsMqtt, resetTopicsMqtt} = mqttTopicsSlice.actions;

export default mqttTopicsSlice.reducer;
