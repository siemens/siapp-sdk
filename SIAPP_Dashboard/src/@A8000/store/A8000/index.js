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
import mqtt from './mqtt';
import status from './statusSlice';
import simu from './simuSlice';
import file from './fileSlice';

const A8000Reducers = combineReducers({
	status,
	mqtt,
	simu,
	file,
});

export default A8000Reducers;
