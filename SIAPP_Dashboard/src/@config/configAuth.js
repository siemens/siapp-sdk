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

export const configRoles = {
	admin: ['security Admin', 'security auditor', 'role based access manadmin', 'admin'],
	operator: [
		'operator',
		'engineer',
		'installer',
		'security Admin',
		'security Auditor',
		'role based access manadmin',
		'admin',
	],
	viewer: [
		'viewer',
		'operator',
		'engineer',
		'installer',
		'security Admin',
		'security Auditor',
		'role based access manadmin',
		'admin',
	],
	onlyGuest: ['guest'],
};
