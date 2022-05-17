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
import Button from '@material-tailwind/react/Button';
import H6 from '@material-tailwind/react/Heading6';

function ControlButton(props) {
	function handleClick() {
		props.onChange(props.data, 1);

		setTimeout(() => {
			props.onChange(props.data, 0);
		}, props.data.config.timeout_ms);
	}

	if (!props.data) {
		return null;
	}
	return (
		<>
			<div className='flex flex-wrap justify-start w-full px-8'>
				<Button
					type='file'
					onClick={handleClick}
					color='lightBlue'
					buttonType='outline'
					size='sm'
					rounded={false}
					block={true}
					iconOnly={false}
					ripple='dark'>
					<H6 color='lightBlue'>{props.data.name}</H6>
				</Button>
			</div>
		</>
	);
}

export default memo(ControlButton);
