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

import {useState} from 'react';
import {Upload as IconUpload, FolderOpen as IconFolderOpen} from '@mui/icons-material';
import WidgetMenu from '@A8000/components/layout/WidgetMenu';
import Card from '@material-tailwind/react/Card';
import CardBody from '@material-tailwind/react/CardBody';
import CardHeader from '@material-tailwind/react/CardHeader';
import FileList from '@A8000/components/file/FileList';
import FileImport from '@A8000/components/file/FileImport';
import {Trans} from 'react-i18next';

function WidgetFiles(props) {
	const [openView, setOpenView] = useState(0);

	const dataMenu = [
		{
			role: 'admin',
			icon: <IconUpload />,
			tooltip: <Trans i18nKey='uppercase.specialFunctions'>SPECIAL FUNCTIONS </Trans>,
		},
		{
			role: 'admin',
			icon: <IconFolderOpen />,
			tooltip: <Trans i18nKey='uppercase.fileExplorer'>FILE EXPLORER </Trans>,
		},
	];

	function handleView(newView) {
		setOpenView(newView);
	}

	return (
		<Card>
			<CardHeader color={props.color} contentPosition='full'>
				<div className='flex flex-wrap justify-between flex-row'>
					<h2 className='text-white text-2xl'>
						<Trans i18nKey='uppercase.fileExplorer'>FILE EXPLORER </Trans>
					</h2>
					<div className='flex justify-between'>
						<WidgetMenu color={props.color} dataMenu={dataMenu} onSelectedView={handleView} openView={openView} />
					</div>
				</div>
			</CardHeader>
			<CardBody>
				{openView === 0 && <FileImport />}
				{openView === 1 && <FileList />}
			</CardBody>
		</Card>
	);
}

export default WidgetFiles;
