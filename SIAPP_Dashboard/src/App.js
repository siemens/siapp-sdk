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

import {Routes, Route, BrowserRouter} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {PublicRoute} from '@A8000/utils/PublicRoute';
import {PrivateRoute} from '@A8000/utils/PrivateRoute';
import InitServices from '@A8000/utils/InitServices';
import SplashScreen from '@A8000/components/layout/SplashScreen';
import Login from 'apps/auth/Login';
import Logout from 'apps/auth/Logout';
import {sidebarA8000} from '@config/configLinks';

// Style Sheets
import '@assets/styles/tailwind.css';
import DefaultPage from '@A8000/utils/DefaultPage';

export default function App() {
	const status = useSelector(({A8000}) => A8000.status);
	return (
		<BrowserRouter>
			<InitServices />
			{status && status.isLoading === false ? (
				<div className='md:ml-64'>
					<Routes>
						{sidebarA8000.map((data) =>
							data.children.map((children) => (
								<Route exact path={children.link} element={<PrivateRoute />}>
									<Route exact path={children.link} element={children.element} />
								</Route>
							)),
						)}
						<Route exact path='/login' element={<PublicRoute />}>
							<Route exact path='/login' element={<Login />} />
						</Route>
						<Route exact path='/logout' element={<PrivateRoute />}>
							<Route exact path='/logout' element={<Logout />} />
						</Route>
						{/* <Route path='*' element={<Navigate from='*' to={defaultLink} />} /> */}
						<Route path='*' element={<DefaultPage />} />
					</Routes>
				</div>
			) : (
				<SplashScreen />
			)}
		</BrowserRouter>
	);
}
