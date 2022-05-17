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
import {
	EvStation as IconEvStation,
	Insights as IconInsights,
	Engineering as IconEngineering,
} from '@mui/icons-material';
import SiappAdmin from 'apps/siapp/admin/SiappAdmin';
import SiappDashboard from 'apps/siapp/dashboard/SiappDashboard';
import OcppDashboard from 'apps/ocpp/dashboard/OcppDashboard';
import SaveButton from '@A8000/components/layout/SaveButton';
import OcppReset from 'apps/ocpp/dashboard/components/OcppReset';

export const sidebarA8000 = [
	{
		titleCategory: 'OCPP',
		functionBlock: 'ocpp',
		children: [
			{
				id: 'dashboardOcpp',
				title: 'DASHBOARD',
				translate: 'uppercase.dashboard',
				icon: <IconEvStation />,
				link: '/ocpp/dashboard',
				element: <OcppDashboard />,
				role: 'viewer',
				functionBlock: 'ocpp',
			},
		],
	},
	{
		titleCategory: 'SIAPP',
		functionBlock: 'siapp',
		children: [
			{
				id: 'dashboardSiapp',
				title: 'DASHBOARD',
				translate: 'uppercase.dashboard',
				icon: <IconInsights />,
				link: '/siapp/dashboard',
				element: <SiappDashboard />,
				role: 'viewer',
				functionBlock: 'siapp',
			},
			{
				id: 'admin',
				title: 'ADMIN',
				translate: 'uppercase.admin',
				icon: <IconEngineering />,
				link: '/siapp/admin',
				element: <SiappAdmin />,
				role: 'admin',
				functionBlock: 'siapp',
			},
		],
	},
];

export const sidebarButtonsA8000 = [
	{
		id: 'saveButton',
		button: <SaveButton />,
		role: 'admin',
		functionBlock: 'siapp',
	},
	{
		id: 'ocppReset',
		button: <OcppReset />,
		role: 'admin',
		functionBlock: 'ocpp',
	},
];

export const defaultsSIAPP = [
	{
		id: 'OCPP16',
		function: ['OCPP', 'SIAPP'],
		loginLink: '/ocpp/dashboard',
	},
	{
		id: 'OPCUA-SERVER',
		function: ['SIAPP'],
		loginLink: '/siapp/dashboard',
	},
];

export const configFunctionBlock = {
	ocpp: ['OCPP16', 'OCPP16-DEV'],
	siapp: ['', 'OCPP16', 'OCPP16-DEV', 'OPCUA-SERVER', 'OPCUA-SERVER-DEV'],
};

export const defaultLink = '/siapp/dashboard';
