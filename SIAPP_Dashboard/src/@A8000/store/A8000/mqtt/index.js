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

import {combineReducers} from '@reduxjs/toolkit';
import topicsMqtt from './mqttTopicsSlice';
import dataMqtt from './mqttDataSlice';
import graphMqtt from './mqttGraphSlice';

const mqttReducers = combineReducers({
	topicsMqtt,
	dataMqtt,
	graphMqtt,
});

export default mqttReducers;
