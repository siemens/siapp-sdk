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

import ModelMqttMessage from '@A8000/models/ModelMqttMessage';
import {setDataByTopic} from '@A8000/store/A8000/mqtt/mqttDataSlice';
import {memo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import ControlButton from '../control/ControlButton';
import ControlSlider from '../control/ControlSlider';
import ControlSwitch from '../control/ControlSwitch';
import ControlTextField from '../control/ControlTextField';
import WidgetFooter from '../layout/WidgetFooter';

function TableControl(props) {
	const dispatch = useDispatch();
	const status = useSelector(({A8000}) => A8000.status);

	function handleMessage(item, val) {
		const newTopic = props.id + item.topic;
		const mqttData = {
			topic: newTopic,
			message: {
				dataType: item.dataType,
				value: val,
				meta: {name: newTopic},
			},
		};

		const message = ModelMqttMessage(mqttData);
		dispatch(setDataByTopic(message));
	}

	if (!props.graphMqtt && !props.dataMqtt) {
		return null;
	}
	return (
		<>
			<div className='overflow-x-auto mb-2'>
				{props.graphMqtt.control
					.filter((topic) => topic.group === props.group)
					.sort((a, b) => (a.sort > b.sort ? 1 : -1))
					.map((item) => {
						return (
							<div
								key={item.topic}
								className='flex flex-wrap mx-auto item-center justify-center text-center w-full px-3 py-1'>
								{item.type === 'button' && (
									<ControlButton prefix={props.id} data={item} dataMqtt={props.dataMqtt} onChange={handleMessage} />
								)}
								{item.type === 'switch' && (
									<ControlSwitch prefix={props.id} data={item} dataMqtt={props.dataMqtt} onChange={handleMessage} />
								)}
								{(item.type === 'sliderInt' || item.type === 'sliderFloat') && (
									<ControlSlider prefix={props.id} data={item} dataMqtt={props.dataMqtt} onChange={handleMessage} />
								)}
								{(item.type === 'int' || item.type === 'float' || item.type === 'string') && (
									<ControlTextField prefix={props.id} data={item} dataMqtt={props.dataMqtt} onChange={handleMessage} />
								)}
							</div>
						);
					})}
				<div className='flex flex-wrap justify-end w-full px-8'>
					<WidgetFooter updatedAt={status.updatedAt} />
				</div>
			</div>
		</>
	);
}

export default memo(TableControl);
