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
import {useState} from 'react';
import {NavLink} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {constApiA8000} from '@config/constA8000';
import AdminHeader from '@A8000/components/layout/AdminHeader';
import {Login as IconLogin} from '@mui/icons-material';
import Image from '@material-tailwind/react/Image';
import H6 from '@material-tailwind/react/Heading6';
import configEnv from '@config/configEnv';
import {sidebarA8000, sidebarButtonsA8000} from '@config/configLinks';
import {Trans} from 'react-i18next';
import {configRoles} from '@config/configAuth';
import ModeButton from './ModeButton';
import {configFunctionBlock} from '@config/configLinks';
import {Link, Tooltip} from '@mui/material';
import {fileDownload} from '@A8000/store/A8000/fileSlice';
import ImgLogo from '@assets/img/A8000/logo/logo.png';

function Sidebar() {
	const dispatch = useDispatch();
	const auth = useSelector(({auth}) => auth);
	const [showSidebar, setShowSidebar] = useState('-left-64');

	return (
		<>
			<AdminHeader showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
			<div
				className={`h-screen fixed top-0 md:left-0 ${showSidebar} overflow-y-auto flex-row flex-nowrap overflow-hidden shadow-xl bg-white w-64 z-10 py-4 px-6 transition-all duration-300`}>
				<div className='flex-col items-stretch min-h-full flex-nowrap px-0 relative'>
					<Image src={ImgLogo} rounded={false} raised={false} alt='Image' />
					<div className='flex flex-col'>
						<hr className='my-4 min-w-full' />
						{auth.isLogin && (
							<ul className='flex-col min-w-full flex list-none'>
								<ModeButton />
								{sidebarA8000.map((data) => (
									<div key={data.titleCategory}>
										{configFunctionBlock[data.functionBlock].indexOf(auth.siappName.toUpperCase()) > -1 && (
											<H6 color='teal'>{data.titleCategory}</H6>
										)}
										{data.children.map((children) => (
											<div key={children.id}>
												{_.intersection(configRoles[children.role], auth.roles).length > 0 &&
													configFunctionBlock[children.functionBlock].indexOf(auth.siappName.toUpperCase()) > -1 && (
														<li className='rounded-lg mb-2'>
															<NavLink
																to={children.link}
																className={({isActive}) =>
																	isActive
																		? 'flex items-center gap-4 text-sm font-light px-4 py-3 rounded-lg bg-gradient-to-tr from-teal-500 to-teal-700 text-white shadow-md'
																		: 'flex items-center gap-4 text-sm text-gray-700 font-light px-4 py-3 rounded-lg'
																}>
																{children.icon}
																<Trans i18nKey={children.translate}>{children.title} </Trans>
															</NavLink>
														</li>
													)}
											</div>
										))}
									</div>
								))}
								{sidebarButtonsA8000.map((data) => (
									<div key={data.id}>
										{_.intersection(configRoles[data.role], auth.roles).length > 0 &&
											configFunctionBlock[data.functionBlock].indexOf(auth.siappName.toUpperCase()) > -1 &&
											data.button}
									</div>
								))}
							</ul>
						)}

						{!auth.isLogin && (
							<ul className='flex-col min-w-full flex list-none'>
								<li className='rounded-lg mb-2 '>
									<NavLink
										to='/login'
										className={({isActive}) =>
											isActive
												? 'flex items-center gap-4 text-sm font-light px-4 py-3 rounded-lg bg-gradient-to-tr from-teal-500 to-teal-700 text-white shadow-md'
												: 'flex items-center gap-4 text-sm text-gray-700 font-light px-4 py-3 rounded-lg'
										}>
										<IconLogin />
										<Trans i18nKey='uppercase.login'>LOGIN</Trans>
									</NavLink>
								</li>
							</ul>
						)}
					</div>
					<hr className='my-4 min-w-full' />
					<div className='text-gray-400 text-xs flex justify-center'>Open Source Information:</div>
					<Tooltip title='Open Source Information (Web)'>
						<Link
							href={constApiA8000.filenameWebOSS}
							underline='hover'
							color='inherit'
							target='_blank'
							rel='noreferrer'
							download>
							<div className='text-gray-400 text-xs flex justify-center'>WEB: {configEnv.version}</div>
						</Link>
					</Tooltip>
					<Tooltip title='Open Source Information (SIAPP)'>
						<Link
							onClick={(e) => dispatch(fileDownload('export/', constApiA8000.filenameSiappOSS))}
							underline='hover'
							color='inherit'
							style={{cursor: 'pointer'}}>
							<div className='text-gray-400 text-xs flex justify-center'>
								{auth.siappName !== '' ? auth.siappName + ': ' + auth.siappVersion : ''}
							</div>
						</Link>
					</Tooltip>
				</div>
			</div>
		</>
	);
}

export default Sidebar;
