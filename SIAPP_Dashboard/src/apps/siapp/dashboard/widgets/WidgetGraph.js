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

import {memo, useCallback, useState} from 'react';
import {useDispatch} from 'react-redux';
import Card from '@material-tailwind/react/Card';
import CardBody from '@material-tailwind/react/CardBody';
import CardHeader from '@material-tailwind/react/CardHeader';
import {
	Insights as IconInsights,
	Visibility as IconVisibility,
	Tune as IconTune,
	Settings as IconSettings,
	SettingsSuggest as IconSettingsSuggest,
} from '@mui/icons-material';
import WidgetMenu from '@A8000/components/layout/WidgetMenu';
import {deleteMqttGraphWidget} from '@A8000/store/A8000/mqtt/mqttGraphSlice';
import TableGraph from '@A8000/components/table/TableGraph';
import PanelGraph from '@A8000/components/panel/PanelGraph';
import TableData from '@A8000/components/table/TableData';
import TableConfigWidget from '@A8000/components/table/TableConfigWidget';
import {editMqttGraphWidget} from '@A8000/store/A8000/mqtt/mqttGraphSlice';
import TableControl from '@A8000/components/table/TableControl';
import {Trans} from 'react-i18next';
import TrackVisibility from 'react-on-screen';

function WidgetGraph(props) {
	const dispatch = useDispatch();
	const [openView, setOpenView] = useState(props.dataConfig.defaultView);

	const dataMenu = [
		{role: 'viewer', icon: <IconInsights />, tooltip: <Trans i18nKey='uppercase.graph'>GRAPH </Trans>},
		{role: 'viewer', icon: <IconVisibility />, tooltip: <Trans i18nKey='uppercase.data'>DATA </Trans>},
		{role: 'operator', icon: <IconTune />, tooltip: <Trans i18nKey='uppercase.control'>CONTROL </Trans>},
		{role: 'admin', icon: <IconSettings />, tooltip: <Trans i18nKey='uppercase.settings'>SETTINGS </Trans>},
		{
			role: 'admin',
			icon: <IconSettingsSuggest />,
			tooltip: <Trans i18nKey='uppercase.settingsData'>SETTINGS DATA </Trans>,
		},
	];

	const handleView = useCallback((newView) => {
		setOpenView(newView);
	}, []);

	const handleChangeConfig = useCallback(
		(id, model) => {
			dispatch(editMqttGraphWidget(id, model));
		},
		[dispatch],
	);

	const handleRemoveWidget = useCallback(
		(id) => {
			dispatch(deleteMqttGraphWidget(id));
		},
		[dispatch],
	);

	if (!props.graphMqtt) {
		return null;
	}
	return (
		<Card>
			<CardHeader color={props.color} contentPosition='full'>
				<div className='flex flex-wrap justify-between flex-row'>
					<h2 className='text-white text-2xl'>{props.dataConfig.name}</h2>
					<div className='flex justify-between'>
						<WidgetMenu color={props.color} dataMenu={dataMenu} onSelectedView={handleView} openView={openView} />
					</div>
				</div>
			</CardHeader>
			<CardBody>
				{openView === 0 &&
					props.graphMqtt.graph.filter((topic) => topic.type === 'archive' && topic.group === props.dataConfig.id)
						.length > 0 && (
						<TrackVisibility partialVisibility>
							<PanelGraph
								topicId=''
								graphData={props.graphMqtt.graph.filter(
									(topic) => topic.type === 'archive' && topic.group === props.dataConfig.id,
								)}
							/>
						</TrackVisibility>
					)}
				{openView === 1 && (
					<div className='w-full'>
						<TableData id='' group={props.dataConfig.id} graphMqtt={props.graphMqtt} dataMqtt={props.dataMqtt} />
					</div>
				)}
				{openView === 2 && (
					<div className='w-full'>
						<TableControl id='' group={props.dataConfig.id} graphMqtt={props.graphMqtt} dataMqtt={props.dataMqtt} />
					</div>
				)}
				{openView === 3 && (
					<div className='flex justify-center'>
						<TableConfigWidget
							id={props.dataConfig.id}
							dataConfig={props.dataConfig}
							onChange={handleChangeConfig}
							onRemove={handleRemoveWidget}
						/>
					</div>
				)}
				{openView === 4 && (
					<div className='w-full'>
						<TableGraph id='' graphMqtt={props.graphMqtt} group={props.dataConfig.id} />
					</div>
				)}
			</CardBody>
		</Card>
	);
}

export default memo(WidgetGraph);
