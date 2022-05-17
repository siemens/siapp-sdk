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

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from 'App';
import {Provider} from 'react-redux';
import store from '@A8000/store';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
		,
	</React.StrictMode>,
);
