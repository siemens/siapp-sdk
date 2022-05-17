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

import _ from '@lodash';
import moment from 'moment';

export default function ModelMqttMessage(data) {
	const nowTime = moment().valueOf();
	data = data || {};

	const dataModel = {
		topic: 'topic',
		message: {
			timestamp: nowTime,
			dataType: 'string',
			value: '',
			state: [],
			meta: {name: 'topic', unit: ''},
		},
		// qos: 1,
		retain: true,
	};

	return _.merge(dataModel, data);
}
