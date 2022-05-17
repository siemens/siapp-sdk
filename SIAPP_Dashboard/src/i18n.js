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

import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {i18nResources} from '@config/configI18n';

i18n
	// pass the i18n instance to react-i18next.
	.use(initReactI18next)
	// init i18next
	// for all options read: https://www.i18next.com/overview/configuration-options
	.init({
		detection: {
			order: [],
			caches: [],
		},
		resources: i18nResources,
		fallbackLng: 'en',
		debug: false,
		interpolation: {
			escapeValue: false, // not needed for react as it escapes by default
		},
	});

export default i18n;
