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

import {injectReducer} from '@A8000/store/index';

const withReducer = (key, reducer) => (WrappedComponent) => {
	injectReducer(key, reducer);

	return (props) => <WrappedComponent {...props} />;
};

export default withReducer;
