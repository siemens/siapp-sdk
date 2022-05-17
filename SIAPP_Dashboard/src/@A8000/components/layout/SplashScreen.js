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

import React, {memo} from 'react';
import {CircularProgress, Dialog} from '@mui/material';

function SplashScreen(props) {
	return (
		<Dialog
			open={true}
			PaperProps={{
				style: {
					width: '100vw',
					height: '100vh',
					backgroundColor: 'transparent',
					boxShadow: 'none',
				},
			}}>
			<CircularProgress />
		</Dialog>
	);
}

export default memo(SplashScreen);
