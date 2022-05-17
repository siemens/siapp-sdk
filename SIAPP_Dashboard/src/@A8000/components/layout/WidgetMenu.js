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
import {memo, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import Button from '@material-tailwind/react/Button';
import {Tooltip} from '@mui/material';
import {configRoles} from '@config/configAuth';
import {updateExpireTime} from '@A8000/store/authSlice';

function WidgetMenu(props) {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const auth = useSelector(({auth}) => auth);
	const role = props.dataMenu[props.openView].role;

	useEffect(() => {
		dispatch(updateExpireTime());
	}, [dispatch]);

	useEffect(() => {
		if (_.intersection(configRoles[role], auth.roles).length === 0) {
			if (props.openView === 0) {
				navigate('/');
			} else {
				props.onSelectedView(0);
			}
		}
	}, [auth.roles, navigate, props, role]);

	function handleView(newView) {
		props.onSelectedView(newView);
	}

	return (
		<>
			{props.dataMenu.map((data, iData) => (
				<div key={data.tooltip + iData}>
					{_.intersection(configRoles[data.role], auth.roles).length > 0 && (
						<Tooltip title={data.tooltip}>
							<Button
								onClick={() => {
									handleView(iData);
								}}
								color={props.openView === iData ? props.color : 'light'}
								buttonType='filled'
								size='regular'
								rounded
								block={false}
								iconOnly
								ripple='dark'>
								{data.icon}
							</Button>
						</Tooltip>
					)}
				</div>
			))}
		</>
	);
}

export default memo(WidgetMenu);
