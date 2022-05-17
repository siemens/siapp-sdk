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

import {memo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import Button from '@material-tailwind/react/Button';
import {Dialog, DialogTitle, DialogActions} from '@mui/material';
import {Trans} from 'react-i18next';
import {ManageAccounts as IconUser, Logout as IconLogout} from '@mui/icons-material';
import {setViewMode} from '@A8000/store/authSlice';
import {initA8000} from '@config/configInit';

function ModeButton(props) {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const auth = useSelector(({auth}) => auth);
	const [open, setOpen] = useState(false);

	function handleCancel() {
		setOpen(false);
	}

	function handleViewMode() {
		dispatch(setViewMode());
		setOpen(false);
		dispatch(initA8000());
	}

	function handleLogout() {
		navigate('/logout');
		setOpen(false);
	}

	return (
		<>
			<div className='flex flex-col justify-between w-full m-1'>
				<Button
					onClick={() => {
						setOpen(true);
					}}
					color='teal'
					buttonType='link'
					size='small'
					rounded={false}
					block={false}
					iconOnly={false}
					style={{justifyContent: 'flex-start', textTransform: 'none'}}
					ripple='dark'>
					<div className='flex items-center justify-between w-full'>
						<IconUser />
						{auth.roles.length === 1 && auth.roles[0] === 'viewer' ? 'VIEW MODE' : auth.username}
						<IconLogout />
					</div>
				</Button>
			</div>
			<Dialog fullWidth size='sm' open={open} onClose={handleCancel}>
				<DialogTitle>MODE</DialogTitle>

				<DialogActions>
					<div className='flex flex-col justify-between w-full m-1'>
						<Button
							onClick={handleCancel}
							color='gray'
							buttonType='link'
							size='lg'
							rounded={false}
							block={true}
							iconOnly={false}
							ripple='dark'>
							<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
						</Button>

						<Button
							onClick={handleViewMode}
							color='teal'
							buttonType='link'
							size='lg'
							rounded={false}
							block={true}
							iconOnly={false}
							ripple='dark'>
							VIEW MODE
						</Button>

						<Button
							onClick={handleLogout}
							color='blue'
							buttonType='link'
							size='lg'
							rounded={false}
							block={true}
							iconOnly={false}
							ripple='dark'>
							<Trans i18nKey='uppercase.login'>LOGIN</Trans> / <Trans i18nKey='uppercase.logout'>LOGOUT</Trans>
						</Button>
					</div>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(ModeButton);
