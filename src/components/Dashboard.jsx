import { useState } from "react";
import { Line } from "react-chartjs-2";
// eslint-disable-next-line no-unused-vars
import { Chart as ChartJS } from "chart.js/auto"; // Required for Chart.js to work

function Dashboard() {
	// eslint-disable-next-line no-unused-vars
	const [glucoseReadings, setGlucoseReadings] = useState([
		{ time: "00:00", value: 100 },
		{ time: "04:00", value: 120 },
		{ time: "08:00", value: 140 },
		{ time: "12:00", value: 110 },
		{ time: "16:00", value: 150 },
		{ time: "20:00", value: 130 },
	]);

	const [markers, setMarkers] = useState({
		food: [],
		exercise: [],
	});

	// Line chart data
	const data = {
		labels: glucoseReadings.map((reading) => reading.time),
		datasets: [
			{
				label: "Glucose Readings (mg/dL)",
				data: glucoseReadings.map((reading) => reading.value),
				borderColor: "rgba(75, 192, 192, 1)",
				backgroundColor: "rgba(75, 192, 192, 0.2)",
				fill: true,
			},
			// Food markers
			{
				label: "Food",
				data: markers.food,
				pointRadius: 6,
				pointBackgroundColor: "red",
				pointStyle: "circle",
				showLine: false, // Do not connect the markers
			},
			// Exercise markers
			{
				label: "Exercise",
				data: markers.exercise,
				pointRadius: 6,
				pointBackgroundColor: "blue",
				pointStyle: "triangle",
				showLine: false,
			},
		],
	};

	// Handle chart click to add a marker for either food or exercise
	const handleChartClick = (event, type) => {
		const chart = event.chart;

		// Use event.nativeEvent to get the x and y pixel position of the click
		const xPixel = event.native.x;
		const yPixel = event.native.y;

		// Convert pixels to chart data (time)
		const xValue = chart.scales.x.getValueForPixel(xPixel); // Time in hours
		const yValue = chart.scales.y.getValueForPixel(yPixel); // Glucose value

		// Log the click details for debugging
		console.log("xPixel (click X):", xPixel);
		console.log("yPixel (click Y):", yPixel);
		console.log("xValue (time):", xValue);
		console.log("yValue (glucose):", yValue);

		// Get nearest time label by rounding xValue and offsetting the yValue
		const nearestTime = chart.scales.x.ticks[Math.round(xValue)].label;
		const adjustedYValue = yValue + 8;

		// Add new marker based on the type (food or exercise)
		const newMarker = { x: nearestTime, y: adjustedYValue };

		setMarkers((prevMarkers) => {
			if (type === "food") {
				return { ...prevMarkers, food: [...prevMarkers.food, newMarker] };
			} else if (type === "exercise") {
				return {
					...prevMarkers,
					exercise: [...prevMarkers.exercise, newMarker],
				};
			}
			return prevMarkers;
		});
	};

	return (
		<div className="dashboard-page">
			<div className="dashboard-first-div">
				{/* Line chart for glucose readings */}
				<div style={{ height: "400px", width: "100%" }}>
					<Line
						data={data}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							fullSize: true,
							layout: {
								padding: 0,
							},

							plugins: {
								legend: {
									display: true,
									position: "top",
									align: "center",
									labels: {
										usePointStyle: true,
										padding: 20,
									},
								},
							},
							onClick: (event) => {
								const markerType = window.prompt(
									"Enter 'food' or 'exercise' to mark the event:"
								);
								if (markerType === "food" || markerType === "exercise") {
									handleChartClick(event, markerType);
								}
							},
						}}
					/>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
