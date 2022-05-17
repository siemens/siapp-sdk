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

import React, {memo, useState} from 'react';
import {CreateNewFolder as IconCreateNewFolder} from '@mui/icons-material';
import Button from '@material-tailwind/react/Button';
import {Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip} from '@mui/material';
import {Trans} from 'react-i18next';

function ModalAddFolder(props) {
	const [showModal, setShowModal] = useState(false);
	const [id, setId] = useState('');

	function handleChange() {
		props.onClick(id);
		setShowModal(false);
		setId('');
	}

	function handleCancel() {
		setShowModal(false);
		setId('');
	}

	return (
		<>
			<Tooltip title={<Trans i18nKey='button.createFolder'>CREATE FOLDER</Trans>}>
				<Button
					onClick={(e) => setShowModal(true)}
					color='purple'
					buttonType='link'
					size='sm'
					rounded={false}
					block={true}
					iconOnly={true}
					ripple='dark'>
					<IconCreateNewFolder />
				</Button>
			</Tooltip>

			<Dialog fullWidth size='lg' open={showModal} onClose={handleCancel}>
				<DialogTitle>
					<Trans i18nKey='button.createFolder'>CREATE FOLDER</Trans>
				</DialogTitle>
				<DialogContent>
					<div className='flex flex-wrap justify-center w-full my-3'>
						<TextField
							fullWidth
							autoFocus
							value={id}
							onInput={(e) => setId(e.target.value)}
							size='small'
							label='ID'
							variant='outlined'
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='outline' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>

					{id !== '' ? (
						<Button buttonType='outline' color='green' onClick={handleChange} ripple='light'>
							<Trans i18nKey='uppercase.create'>CREATE</Trans>
						</Button>
					) : (
						<Button buttonType='link' color='gray' ripple='light'>
							<Trans i18nKey='uppercase.create'>CREATE</Trans>
						</Button>
					)}
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(ModalAddFolder);
