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

// import { useLocation } from "react-router-dom";
import Button from '@material-tailwind/react/Button';
import {Menu as IconMenu, Close as IconClose} from '@mui/icons-material';
import Image from '@material-tailwind/react/Image';
import ImgLogo from '@assets/img/A8000/logo/logo.png';
import ImgBG from '@assets/img/logo/bgTop.jpg';
import {memo} from 'react';

function AdminHeader({showSidebar, setShowSidebar}) {
	// const location = useLocation().pathname;

	return (
		<nav className='h-full bg-no-repeat bg-cover md:ml-64 pt-6 pb-32 px-3' style={{backgroundImage: `url(${ImgBG})`}}>
			<div className='container max-w-full mx-auto flex items-center justify-between md:pr-8 md:pl-10'>
				<div className='md:hidden'>
					<Button
						color='transparent'
						buttonType='link'
						size='lg'
						iconOnly
						rounded
						ripple='light'
						onClick={() => setShowSidebar('left-0')}>
						<IconMenu />
					</Button>
					<div
						className={`absolute top-2 md:hidden ${
							showSidebar === 'left-0' ? 'left-64' : '-left-64'
						} z-50 transition-all duration-300`}>
						<Button
							color='transparent'
							buttonType='link'
							size='lg'
							iconOnly
							rounded
							ripple='light'
							onClick={() => setShowSidebar('-left-64')}>
							<IconClose />
						</Button>
					</div>
				</div>

				<div className='flex justify-between items-end w-full'>
					<h4 className='uppercase text-white text-2xl tracking-wider mt-1'>
						{/* {location === "/" ? "DASHBOARD" : location.toUpperCase().replace("/", "")} */}
					</h4>

					<div className='w-2/12'>
						<Image src={ImgLogo} rounded={false} raised={false} alt='Image' />
					</div>
				</div>
			</div>
		</nav>
	);
}

export default memo(AdminHeader);
