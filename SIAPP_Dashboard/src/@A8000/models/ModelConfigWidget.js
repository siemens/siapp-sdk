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

export default function ModelConfigWidget(data) {
	data = data || {};

	const dataModel = {
		id: moment().valueOf(),
		name: 'WIDGET',
		defaultView: 0,
	};

	return _.merge(dataModel, data);
}
