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
import {Dialog, DialogTitle, DialogContent, DialogActions, Tooltip} from '@mui/material';
import Button from '@material-tailwind/react/Button';
import {DeleteForeverOutlined as IconDeleteForeverOutlined} from '@mui/icons-material';
import {Trans} from 'react-i18next';

function ModalDelete(props) {
	const [showModal, setShowModal] = useState(false);

	function handleRemove() {
		setShowModal(false);
		props.onClick(props.id);
	}

	return (
		<>
			<Tooltip title={<Trans i18nKey={props.translate}>DELETE </Trans>}>
				<Button
					onClick={(e) => setShowModal(true)}
					color='red'
					buttonType={props.iconOnly ? 'link' : 'outline'}
					size='sm'
					rounded={false}
					block={true}
					iconOnly={props.iconOnly}
					ripple='dark'>
					<IconDeleteForeverOutlined />
					{props.iconOnly ? '' : <Trans i18nKey={props.translate}>DELETE </Trans>}
				</Button>
			</Tooltip>

			<Dialog fullWidth size='sm' open={showModal} onClose={() => setShowModal(false)}>
				<DialogTitle>
					<Trans i18nKey={props.translate}>DELETE </Trans>
				</DialogTitle>
				<DialogContent>
					<p className='text-base leading-relaxed text-gray-600 font-normal'>
						{<Trans i18nKey='text.delete'>Do you realy want to delete this? </Trans>}
					</p>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='link' onClick={(e) => setShowModal(false)} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>

					<Button buttonType='outline' color='red' onClick={handleRemove} ripple='light'>
						<Trans i18nKey='uppercase.delete'>DELETE </Trans>
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(ModalDelete);
