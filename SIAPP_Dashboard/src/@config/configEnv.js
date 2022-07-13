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

const prodConfig = {
	urlApi: '/api',
	devMode: false,
	reduxLogger: false,
	updateData: 60, // seconds
	expireTimeout: 10, // minutes
	version: '1.0.0',
};

const devConfig = {
	urlApi: 'http://localhost:8088/api',
	// urlApi: "https://10.27.3.171:443/api",
	devMode: true,
	reduxLogger: false,
	updateData: 60, // seconds
	expireTimeout: 10, // minutes
	version: '1.0.0.DEV',
};

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

export default config;
