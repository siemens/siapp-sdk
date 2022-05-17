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

export default function GraphModel(data) {
	data = data || {};

	const dataModel = {
		series: [],
		options: {
			chart: {
				id: 'area-datetime',
				type: 'area',
				height: 350,
				zoom: {
					autoScaleYaxis: true,
				},
				animations: {
					enabled: true,
					dynamicAnimation: {
						enabled: false,
					},
				},
				toolbar: {
					show: true,
					offsetX: 0,
					offsetY: 0,
					tools: {
						download: true,
						selection: true,
						zoom: true,
						zoomin: true,
						zoomout: true,
						pan: true,
						reset: true | '<img src="/static/icons/reset.png" width="20">',
						customIcons: [],
					},
					export: {
						csv: {
							filename: undefined,
							columnDelimiter: ',',
							headerCategory: 'category',
							headerValue: 'value',
							dateFormatter(timestamp) {
								return new Date(timestamp).toDateString();
							},
						},
						svg: {
							filename: undefined,
						},
						png: {
							filename: undefined,
						},
					},
					autoSelected: 'zoom',
				},
			},
			stroke: {
				curve: 'stepline',
			},
			dataLabels: {
				enabled: false,
			},
			legend: {
				show: true,
				showForSingleSeries: true,
			},
			xaxis: {
				type: 'datetime',
				// min: new Date(startTime).getTime(),
				// tickAmount: 4,
				labels: {
					datetimeUTC: false,
				},
			},
			// yaxis: {
			// 	min: 0,
			// },
			tooltip: {
				x: {
					format: 'yyyy-MM-dd HH:mm',
				},
			},
			fill: {
				type: 'gradient',
				gradient: {
					shadeIntensity: 1,
					opacityFrom: 0.7,
					opacityTo: 0.9,
					stops: [0, 100],
				},
			},
		},
	};

	return _.merge(dataModel, data);
}
