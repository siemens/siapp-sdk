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
import {useSelector} from 'react-redux';
import Card from '@material-tailwind/react/Card';
import CardBody from '@material-tailwind/react/CardBody';
import CardHeader from '@material-tailwind/react/CardHeader';
import {
	Speed as IconSpeed,
	Tune as IconTune,
	// Settings as IconSettings
} from '@mui/icons-material';
import WidgetMenu from '@A8000/components/layout/WidgetMenu';
import SimuPanel from '@A8000/components/simu/SimuPanel';
import SimuStatus from '@A8000/components/simu/SimuStatus';
import {Trans} from 'react-i18next';
import TrackVisibility from 'react-on-screen';

function WidgetSimu(props) {
	const [openView, setOpenView] = useState(0);
	const simuData = useSelector(({A8000}) => A8000.simu);

	const dataMenu = [
		{role: 'admin', icon: <IconSpeed />, tooltip: <Trans i18nKey='uppercase.simulation'>SIMULATION </Trans>},
		{role: 'admin', icon: <IconTune />, tooltip: <Trans i18nKey='uppercase.status'>STATUS </Trans>},
	];

	const handleView = useCallback((newView) => {
		setOpenView(newView);
	}, []);

	return (
		<Card>
			<CardHeader color={props.color} contentPosition='full'>
				<div className='flex flex-wrap justify-between flex-row'>
					<h2 className='text-white text-2xl'>
						<Trans i18nKey='uppercase.simulation'>SIMULATION </Trans>
					</h2>
					<div className='flex justify-between'>
						<WidgetMenu color={props.color} dataMenu={dataMenu} onSelectedView={handleView} openView={openView} />
					</div>
				</div>
			</CardHeader>
			<CardBody>
				{openView === 0 && (
					<TrackVisibility partialVisibility>
						<SimuPanel />
					</TrackVisibility>
				)}
				{openView === 1 && (
					<TrackVisibility partialVisibility>
						<SimuStatus data={simuData} />
					</TrackVisibility>
				)}
			</CardBody>
		</Card>
	);
}

export default memo(WidgetSimu);
