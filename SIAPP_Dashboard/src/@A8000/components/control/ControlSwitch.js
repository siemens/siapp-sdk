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
import {memo, useEffect, useState} from 'react';
import {Switch} from '@mui/material';
import H6 from '@material-tailwind/react/Heading6';

function ControlSwitch(props) {
	const newTopic = props.prefix + props.data.topic;
	const topicData = _.find(props.dataMqtt, {id: newTopic});
	const [value, setValue] = useState(props.data.config.default);

	useEffect(() => {
		if (topicData !== undefined) {
			setValue(topicData.value);
		}
	}, [topicData]);

	function handleChange() {
		let val = value;
		if (val === 0) {
			val = 1;
		} else {
			val = 0;
		}
		setValue(val);
		props.onChange(props.data, val);
	}

	if (!props.data) {
		return null;
	}
	return (
		<>
			<div className='flex flex-wrap justify-start w-full px-8'>
				<div className='flex flex-wrap justify-start w-2/6'>
					<H6 color='lightBlue'>{props.data.name}</H6>
				</div>
				<div className='flex flex-wrap justify-center w-2/6 '>
					<Switch checked={value === 1 ? true : false} onClick={handleChange} color='primary' />
				</div>
			</div>
		</>
	);
}

export default memo(ControlSwitch);
