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
import statusOcpp from './ocppStatusSlice';
import configOcpp from './ocppConfigSlice';
import typicalsOcpp from './ocppTypicalsSlice';

const reducer = combineReducers({
	statusOcpp,
	configOcpp,
	typicalsOcpp,
});

export default reducer;
