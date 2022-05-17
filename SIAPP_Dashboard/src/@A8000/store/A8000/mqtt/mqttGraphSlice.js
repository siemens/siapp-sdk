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
import moment from 'moment';
import _ from '@lodash';
import {toast} from 'react-toastify';
import {optionsToast} from '@A8000/components/layout/AlertMessage';
import {addChangeStatus} from '@A8000/store/A8000/statusSlice';
import {constApiA8000} from '@config/constA8000';
import {configDefaultMqttGraph} from '@config/configDefaults';
import {setPeriod} from '../statusSlice';
import {Trans} from 'react-i18next';

export const initMqttGraph = () => async (dispatch, getState) => {
	await dispatch(getMqttGraph());
	await dispatch(subscribeMqttGraph());
	return;
};

export const getMqttGraph = () => async (dispatch, getState) => {
	const {graphMqtt} = getState().A8000.mqtt;
	let data = {};
	try {
		data = await dispatch(serviceA8000.readA8000(constApiA8000.filenameMqttGraph));
	} catch (error) {
		data = {};
	}
	const newGraphMqtt = cloneDeep(graphMqtt);
	if (data.widgets) newGraphMqtt.widgets = data.widgets;
	if (data.graph) newGraphMqtt.graph = data.graph;
	if (data.control) newGraphMqtt.control = data.control;
	if (data.status) {
		newGraphMqtt.status = data.status;
		dispatch(setPeriod(data.status.graphPeriod));
	}
	return dispatch(setMqttGraph(newGraphMqtt));
};

export const subscribeMqttGraph = () => async (dispatch, getState) => {
	const {graph} = getState().A8000.mqtt.graphMqtt;
	const {control} = getState().A8000.mqtt.graphMqtt;
	const allTopics = [];
	graph.forEach((item) => {
		allTopics.push({topic: item.topic});
	});
	control.forEach((item) => {
		allTopics.push({topic: item.topic});
	});
	dispatch(serviceA8000.subscribeMqtt(allTopics));
	return;
};

export const saveMqttGraph = () => async (dispatch, getState) => {
	const {graphMqtt} = getState().A8000.mqtt;
	try {
		await dispatch(serviceA8000.writeA8000(constApiA8000.filenameMqttGraph, graphMqtt));
		await dispatch(subscribeMqttGraph());
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorUpdate'>"Update failed!"</Trans>, optionsToast);
	}
	return;
};
export const updateMqttGraphWidget = (graphData) => async (dispatch, getState) => {
	dispatch(addChangeStatus('graphMQTT'));
	return dispatch(setMqttGraphWidgets(graphData));
};

export const deleteMqttGraphWidget = (idTopic) => async (dispatch, getState) => {
	const {widgets} = getState().A8000.mqtt.graphMqtt;
	const index = _.findIndex(widgets, {id: idTopic});
	const newWidgets = cloneDeep(widgets);
	newWidgets.splice(index, 1);
	return dispatch(updateMqttGraphWidget(newWidgets));
};

export const addMqttGraphWidget = (data) => async (dispatch, getState) => {
	const nowTime = moment().valueOf();
	const {widgets} = getState().A8000.mqtt.graphMqtt;
	const newWidgets = cloneDeep(widgets);
	newWidgets.push({...data, id: nowTime});
	return dispatch(updateMqttGraphWidget(newWidgets));
};

export const editMqttGraphWidget = (id, data) => async (dispatch, getState) => {
	const {widgets} = getState().A8000.mqtt.graphMqtt;
	const index = _.findIndex(widgets, {id: id});
	const newWidgets = cloneDeep(widgets);
	newWidgets[index] = {...widgets[index], ...data};
	return dispatch(updateMqttGraphWidget(newWidgets));
};

export const updateMqttGraphConfig = (graphData) => async (dispatch, getState) => {
	dispatch(addChangeStatus('graphMQTT'));
	return dispatch(setMqttGraphConfig(graphData));
};

export const deleteMqttGraphConfig = (idTopic) => async (dispatch, getState) => {
	const {graph} = getState().A8000.mqtt.graphMqtt;
	const index = _.findIndex(graph, {id: idTopic});
	const newGraph = cloneDeep(graph);
	newGraph.splice(index, 1);
	return dispatch(updateMqttGraphConfig(newGraph));
};

export const addMqttGraphConfig = (data) => async (dispatch, getState) => {
	const nowTime = moment().valueOf();
	const {graph} = getState().A8000.mqtt.graphMqtt;
	const newGraph = cloneDeep(graph);
	newGraph.push({...data, id: nowTime});
	return dispatch(updateMqttGraphConfig(newGraph));
};

export const editMqttGraphConfig = (data) => async (dispatch, getState) => {
	const {graph} = getState().A8000.mqtt.graphMqtt;
	const index = _.findIndex(graph, {id: data.id});
	const newGraph = cloneDeep(graph);
	newGraph[index] = data;
	return dispatch(updateMqttGraphConfig(newGraph));
};

export const updateMqttGraphControl = (graphData) => async (dispatch, getState) => {
	dispatch(addChangeStatus('graphMQTT'));
	return dispatch(setMqttGraphControl(graphData));
};

export const deleteMqttGraphControl = (idTopic) => async (dispatch, getState) => {
	const {control} = getState().A8000.mqtt.graphMqtt;
	const index = _.findIndex(control, {id: idTopic});
	const newGraph = cloneDeep(control);
	newGraph.splice(index, 1);
	return dispatch(updateMqttGraphControl(newGraph));
};

export const addMqttGraphControl = (data) => async (dispatch, getState) => {
	const nowTime = moment().valueOf();
	const {control} = getState().A8000.mqtt.graphMqtt;
	const newGraph = cloneDeep(control);
	newGraph.push({...data, id: nowTime});
	return dispatch(updateMqttGraphControl(newGraph));
};

export const editMqttGraphControl = (data) => async (dispatch, getState) => {
	const {control} = getState().A8000.mqtt.graphMqtt;
	const index = _.findIndex(control, {id: data.id});
	const newGraph = cloneDeep(control);
	newGraph[index] = data;
	return dispatch(updateMqttGraphControl(newGraph));
};

export const updateMqttGraphStatus = (graphData) => async (dispatch, getState) => {
	dispatch(addChangeStatus('graphMQTT'));
	return dispatch(setMqttGraphStatus(graphData));
};

export const setGraphPeriod = (graphPeriod) => async (dispatch, getState) => {
	const {status} = getState().A8000.mqtt.graphMqtt;
	let newStatus = cloneDeep(status);
	newStatus.graphPeriod = graphPeriod;
	dispatch(setPeriod(graphPeriod));
	return dispatch(updateMqttGraphStatus(newStatus));
};

const initialState = configDefaultMqttGraph;

const mqttGraphSlice = createSlice({
	name: 'A8000/mqtt/graphMqtt',
	initialState,
	reducers: {
		setMqttGraph: (state, action) => {
			return action.payload;
		},
		setMqttGraphStatus: (state, action) => {
			return {
				...state,
				status: action.payload,
			};
		},
		setMqttGraphWidgets: (state, action) => {
			return {
				...state,
				widgets: action.payload,
			};
		},
		setMqttGraphConfig: (state, action) => {
			return {
				...state,
				graph: action.payload,
			};
		},
		setMqttGraphControl: (state, action) => {
			return {
				...state,
				control: action.payload,
			};
		},
		resetMqttGraph: (state, action) => {
			return initialState;
		},
	},
});

export const {
	setMqttGraph,
	setMqttGraphStatus,
	setMqttGraphWidgets,
	setMqttGraphConfig,
	setMqttGraphControl,
	resetMqttGraph,
} = mqttGraphSlice.actions;

export default mqttGraphSlice.reducer;
