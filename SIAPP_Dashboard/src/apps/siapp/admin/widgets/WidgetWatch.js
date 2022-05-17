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

import {useCallback, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Settings as IconSettings} from '@mui/icons-material';
import Card from '@material-tailwind/react/Card';
import CardBody from '@material-tailwind/react/CardBody';
import CardHeader from '@material-tailwind/react/CardHeader';
import {addTopicsMqtt, deleteTopicsMqtt, editTopicsMqtt} from '@A8000/store/A8000/mqtt/mqttTopicsSlice';
import WidgetMenu from '@A8000/components/layout/WidgetMenu';
import TableTopicsMqtt from '@A8000/components/table/TableTopicsMqtt';
import {Trans} from 'react-i18next';

function WidgetWatch(props) {
	const dispatch = useDispatch();
	const topicsMqtt = useSelector(({A8000}) => A8000.mqtt.topicsMqtt);
	const [openView, setOpenView] = useState(0);

	const dataMenu = [
		{role: 'admin', icon: <IconSettings />, tooltip: <Trans i18nKey='uppercase.setpoints'>SETPOINTS </Trans>},
	];
	const dataMenuA = dataMenu;

	const handleView = useCallback((newView) => {
		setOpenView(newView);
	}, []);

	const handleChange = useCallback(
		(id, data) => {
			dispatch(editTopicsMqtt(id, data));
		},
		[dispatch],
	);

	const handleAdd = useCallback(
		(data) => {
			dispatch(addTopicsMqtt(data));
		},
		[dispatch],
	);

	const handleRemove = useCallback(
		(id) => {
			dispatch(deleteTopicsMqtt(id));
		},
		[dispatch],
	);

	return useMemo(
		() => (
			<Card>
				<CardHeader color={props.color} contentPosition='full'>
					<div className='flex flex-wrap justify-between flex-row'>
						<h2 className='text-white text-2xl'>MQTT</h2>
						<div className='flex justify-between'>
							<WidgetMenu color={props.color} dataMenu={dataMenuA} onSelectedView={handleView} openView={openView} />
						</div>
					</div>
					<div className='flex flex-wrap justify-start flex-row'>
						<h3 className='text-white text-lg'>Fixed Setpoints</h3>
					</div>
				</CardHeader>
				<CardBody>
					{openView === 0 && (
						<div className='w-full'>
							<TableTopicsMqtt data={topicsMqtt} onAdd={handleAdd} onRemove={handleRemove} onChange={handleChange} />
						</div>
					)}
				</CardBody>
			</Card>
		),
		[dataMenuA, handleAdd, handleChange, handleRemove, handleView, openView, props.color, topicsMqtt],
	);
}

export default WidgetWatch;
