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

import {memo} from 'react';
import WidgetFiles from './widgets/WidgetFiles';
import WidgetSimu from './widgets/WidgetSimu';
import WidgetWatch from './widgets/WidgetWatch';

function SiappAdmin() {
	return (
		<div className='container mx-auto max-w-full -mt-8 grid grid-cols-1 px-4 mb-16'>
			<div className='flex items-stretch flex-wrap'>
				<div className='flex flex-col w-full px-2 mb-12'>
					<WidgetSimu color='orange' />
				</div>
				<div className='flex flex-col w-full px-2 mb-12'>
					<WidgetFiles color='teal' />
				</div>
				<div className='flex flex-col w-full px-2 mb-12'>
					<WidgetWatch color='purple' />
				</div>
			</div>
		</div>
	);
}

export default memo(SiappAdmin);
