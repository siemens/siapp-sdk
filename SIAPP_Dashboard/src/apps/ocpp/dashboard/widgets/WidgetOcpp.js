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
import {useDispatch, useSelector} from 'react-redux';
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
import {changeController, setOcppConfigKey} from '../store/ocppConfigSlice';
import WidgetMenu from '@A8000/components/layout/WidgetMenu';
import TableGraph from '@A8000/components/table/TableGraph';
import PanelGraph from '@A8000/components/panel/PanelGraph';
import OcppTableConfig from '../components/OcppTableConfig';
import TableData from '@A8000/components/table/TableData';
import OcppStatus from '../components/OcppStatus';
import TableControl from '@A8000/components/table/TableControl';
import {Trans} from 'react-i18next';
import TrackVisibility from 'react-on-screen';
import ModalChangeController from '../components/ModalChangeController';

function WidgetOcpp(props) {
	const dispatch = useDispatch();
	const ocppTypicals = useSelector(({ocpp}) => ocpp.typicalsOcpp);
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

	const handleView = useCallback((newView) => {
		setOpenView(newView);
	}, []);

	const handleChangeConfig = useCallback(
		(id, model) => {
			dispatch(setOcppConfigKey(id, model));
		},
		[dispatch],
	);

	const handleChangeController = useCallback(
		(selectedType, keepValues) => {
			dispatch(changeController(selectedType, keepValues));
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
			</CardHeader>
			<CardBody>
				{openView === 0 &&
					props.graphMqtt.graph.filter((topic) => topic.type === 'archive' && topic.group === 'controllerOCPP').length >
						0 && (
						<TrackVisibility partialVisibility>
							<PanelGraph
								topicId=''
								graphData={props.graphMqtt.graph.filter(
									(topic) => topic.type === 'archive' && topic.group === 'controllerOCPP',
								)}
							/>
						</TrackVisibility>
					)}
				{openView === 1 && (
					<div className='w-full'>
						<TableData id='' group='controllerOCPP' graphMqtt={props.graphMqtt} dataMqtt={props.dataMqtt} />
					</div>
				)}
				{openView === 2 && (
					<>
						<OcppStatus />
						<div className='w-full'>
							<TableControl id='' group='controllerOCPP' graphMqtt={props.graphMqtt} dataMqtt={props.dataMqtt} />
						</div>
					</>
				)}
				{openView === 3 && (
					<>
						<div className='flex justify-center'>
							<OcppTableConfig
								dataConfig={props.dataConfig}
								templateGroup='generalOCPP'
								onChange={handleChangeConfig}
							/>
						</div>
						<div className='flex justify-center'>
							<ModalChangeController data={ocppTypicals.generalOCPP} onClick={handleChangeController} />
						</div>
					</>
				)}
				{openView === 4 && (
					<div className='w-full'>
						<TableGraph id='' graphMqtt={props.graphMqtt} group='controllerOCPP' />
					</div>
				)}
			</CardBody>
		</Card>
	);
}

export default memo(WidgetOcpp);
