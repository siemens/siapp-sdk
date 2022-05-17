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

export const configDefaultMqttGraph = {
	status: {
		graphPeriod: 24,
	},
	widgets: [],
	graph: [
		{
			name: 'Max Power',
			topic: '/1/EVSE/Power/maxSet',
			group: 'stationOCPP',
			type: 'archive',
			typeName: 'ARCHIVE',
			id: 1,
			sort: 100,
		},
		{
			name: 'Actual Power',
			topic: '/1/EVSE/Power',
			group: 'stationOCPP',
			type: 'archive',
			typeName: 'ARCHIVE',
			id: 2,
			sort: 101,
		},
	],
	control: [],
};
