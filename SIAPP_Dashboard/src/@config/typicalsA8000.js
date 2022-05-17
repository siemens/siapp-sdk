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

export const typicalsSelectPeriod = [
	{
		id: 'all',
		name: 'ALL',
		translate: 'uppercase.all',
		value: 0,
	},
	{
		id: 'week',
		name: 'WEEK',
		translate: 'uppercase.week',
		value: 168,
	},
	{
		id: 'day',
		name: 'DAY',
		translate: 'uppercase.day',
		value: 24,
	},
	{
		id: 'hour',
		name: 'HOUR',
		translate: 'uppercase.hour',
		value: 1,
	},
];

export const typicalsMonitor = [
	{
		type: 'archive',
		typeName: 'ARCHIVE',
		sort: 1000,
	},
	{
		type: 'data',
		typeName: 'DATA',
		sort: 1000,
	},
];

export const typicalsControl = [
	{
		type: 'button',
		typeName: 'BUTTON',
		dataType: 'int',
		config: {
			timeout_ms: 1000,
		},
	},
	{
		type: 'switch',
		typeName: 'SWITCH',
		dataType: 'int',
		config: {
			default: 0,
		},
	},
	{
		type: 'sliderInt',
		typeName: 'SLIDER INT',
		dataType: 'int',
		config: {
			min: 0,
			max: 10,
			step: 1,
			default: 0,
		},
	},
	{
		type: 'sliderFloat',
		typeName: 'SLIDER FLOAT',
		dataType: 'float',
		config: {
			min: -10.0,
			max: 10.0,
			step: 0.1,
			default: 0.0,
		},
	},
	{
		type: 'int',
		typeName: 'VALUE INT',
		dataType: 'int',
		config: {
			min: 0,
			max: 1000,
			step: 1,
			default: 0,
		},
	},
	{
		type: 'float',
		typeName: 'VALUE FLOAT',
		dataType: 'float',
		config: {
			min: -1000.0,
			max: 1000.0,
			step: 0.001,
			default: 0.0,
		},
	},
	{
		type: 'string',
		typeName: 'STRING',
		dataType: 'string',
		config: {
			default: '',
		},
	},
];
