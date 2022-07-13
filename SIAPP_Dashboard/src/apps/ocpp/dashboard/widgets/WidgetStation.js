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

import {memo, useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import Card from '@material-tailwind/react/Card';
import CardBody from '@material-tailwind/react/CardBody';
import CardHeader from '@material-tailwind/react/CardHeader';
import {
	EvStation as IconEvStation,
	Visibility as IconVisibility,
	Tune as IconTune,
	Settings as IconSettings,
	SettingsSuggest as IconSettingsSuggest,
} from '@mui/icons-material';
import WidgetMenu from '@A8000/components/layout/WidgetMenu';
import {deleteStation, setOcppConfigKey} from '../store/ocppConfigSlice';
import TableGraph from '@A8000/components/table/TableGraph';
import PanelGraph from '@A8000/components/panel/PanelGraph';
import OcppTableConfig from '../components/OcppTableConfig';
import TableData from '@A8000/components/table/TableData';
import TableControl from '@A8000/components/table/TableControl';
import {Trans} from 'react-i18next';
import TrackVisibility from 'react-on-screen';

function WidgetStation(props) {
	const dispatch = useDispatch();
	const [openView, setOpenView] = useState(0);

	const dataMenu = [
		{role: 'viewer', icon: <IconEvStation />, tooltip: <Trans i18nKey='uppercase.graph'>GRAPH </Trans>},
		{role: 'viewer', icon: <IconVisibility />, tooltip: <Trans i18nKey='uppercase.data'>DATA </Trans>},
		{role: 'operator', icon: <IconTune />, tooltip: <Trans i18nKey='uppercase.control'>CONTROL </Trans>},
		{role: 'admin', icon: <IconSettings />, tooltip: <Trans i18nKey='uppercase.settings'>SETTINGS </Trans>},
		{
			role: 'admin',
			icon: <IconSettingsSuggest />,
			tooltip: <Trans i18nKey='uppercase.settingsData'>SETTINGS DATA </Trans>,
		},
	];

	useEffect(() => {}, [props.dataConfig, props.ocppTypicals]);

	const handleView = useCallback((newView) => {
		setOpenView(newView);
	}, []);

	const handleChangeConfig = useCallback(
		(id, model) => {
			dispatch(setOcppConfigKey(id, model));
		},
		[dispatch],
	);

	const handleRemove = useCallback(
		(id) => {
			dispatch(deleteStation(id));
		},
		[dispatch],
	);
	if (!props.dataConfig || !props.graphMqtt) {
		return null;
	}
	return (
		<Card>
			<CardHeader color={props.color} contentPosition='full'>
				<div className='flex flex-wrap justify-between flex-row'>
					<h2 className='text-white text-2xl'>{props.dataConfig.meta.id}</h2>
					<div className='flex justify-between'>
						<WidgetMenu color={props.color} dataMenu={dataMenu} onSelectedView={handleView} openView={openView} />
					</div>
				</div>
				<div className='flex flex-wrap justify-start flex-row'>
					<h3 className='text-white text-lg'>{props.dataConfig.meta.displayName}</h3>
				</div>
			</CardHeader>
			<CardBody>
				{openView === 0 &&
					props.graphMqtt.graph.filter((topic) => topic.type === 'archive' && topic.group === 'stationOCPP').length >
						0 && (
						<TrackVisibility partialVisibility>
							<PanelGraph
								topicId={'/' + props.dataConfig.meta.id}
								graphData={props.graphMqtt.graph.filter(
									(topic) => topic.type === 'archive' && topic.group === 'stationOCPP',
								)}
							/>
						</TrackVisibility>
					)}
				{openView === 1 && (
					<div className='w-full'>
						<TableData
							id={'/' + props.dataConfig.meta.id}
							group='stationOCPP'
							graphMqtt={props.graphMqtt}
							dataMqtt={props.dataMqtt}
						/>
					</div>
				)}
				{openView === 2 && (
					<div className='w-full'>
						<TableControl
							id={'/' + props.dataConfig.meta.id}
							group='stationOCPP'
							graphMqtt={props.graphMqtt}
							dataMqtt={props.dataMqtt}
						/>
					</div>
				)}
				{openView === 3 && (
					<div className='w-full'>
						<OcppTableConfig
							id={props.id}
							dataConfig={props.dataConfig}
							templateGroup='stationsOCPP'
							onChange={handleChangeConfig}
							onRemove={handleRemove}
						/>
					</div>
				)}
				{openView === 4 && (
					<div className='w-full'>
						<TableGraph id={'/' + props.dataConfig.meta.id} graphMqtt={props.graphMqtt} group='stationOCPP' />
					</div>
				)}
			</CardBody>
		</Card>
	);
}

export default memo(WidgetStation);
