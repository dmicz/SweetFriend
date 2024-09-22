import { useState } from "react";
import "../styles/AddLogModal.css"; // Add CSS for modal styling
import PropTypes from "prop-types";

function AddLogModal({ onClose, onSubmit }) {
	AddLogModal.propTypes = {
		onClose: PropTypes.func.isRequired,
		onSubmit: PropTypes.func.isRequired,
	};

	const [logType, setLogType] = useState(null);
	const [name, setName] = useState("");
	const [totalCarbs, setTotalCarbs] = useState("");
	const [timeSpent, setTimeSpent] = useState("");
	const [intensityLevel, setIntensityLevel] = useState("");
	const [manualEntry, setManualEntry] = useState(true); // New state to track manual entry or image upload

	// Handle form submission
	const handleFormSubmit = (e) => {
		e.preventDefault();

		const newLog = {
			user_id: "user-id-placeholder", // Replace with actual user ID
			name,
			type: logType,
			timestamp: new Date(),
			starred: false,
			details:
				logType === "food"
					? { total_carbs: parseFloat(totalCarbs) }
					: {
							time_spent: parseInt(timeSpent),
							intensity_level: intensityLevel,
					  },
		};

		onSubmit(newLog); // Pass the new log to the parent component
	};

	// Handle image upload
	const handleImageUpload = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);

		try {
			const response = await fetch("/api/analyze_image", {
				method: "POST",
				body: formData,
			});
			const data = await response.json();
			console.log(data);
			// Assuming API returns { name, total_carbs }
			setName(data.meal_name || ""); // Set the name from API response
			setTotalCarbs(data.total_carbs || ""); // Set the total carbs from API response
		} catch (error) {
			console.error("Error uploading image:", error);
		}
	};

	// Render the form dynamically based on the log type and whether it's manual entry or image upload
	const renderForm = () => {
		if (logType === "food") {
			return (
				<>
					{/* Toggle for manual entry or image upload */}
					<div>
						<button onClick={() => setManualEntry(true)}>Enter Manually</button>
						<button onClick={() => setManualEntry(false)}>Upload Image</button>
					</div>

					{manualEntry ? (
						// Manual food entry form
						<form onSubmit={handleFormSubmit}>
							<div>
								<label>Name:</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
							<div>
								<label>Total Carbs (g):</label>
								<input
									type="number"
									step="0.1"
									value={totalCarbs}
									onChange={(e) => setTotalCarbs(e.target.value)}
									required
								/>
							</div>
							<div className="form-buttons">
								<button onClick={() => setLogType(null)}>Back</button>
								<button type="submit">Submit</button>
							</div>
						</form>
					) : (
						// Image upload form
						<form
							method="POST"
							action="/api/analyze_image"
							encType="multipart/form-data"
							onSubmit={handleImageUpload}
						>
							<div>
								<label>Upload Food Image:</label>
								<input type="file" name="file" accept="image/*" required />
							</div>
							<div className="form-buttons">
								<button onClick={() => setLogType(null)}>Back</button>
								<button type="submit">Upload</button>
							</div>
						</form>
					)}
				</>
			);
		} else if (logType === "exercise") {
			// Exercise form
			return (
				<form onSubmit={handleFormSubmit} className="exercise-form">
					<div>
						<label>Name:</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div>
						<label>Time Spent (minutes):</label>
						<input
							type="number"
							value={timeSpent}
							onChange={(e) => setTimeSpent(e.target.value)}
							required
						/>
					</div>
					<div>
						<label>Intensity Level:</label>
						<input
							type="text"
							value={intensityLevel}
							onChange={(e) => setIntensityLevel(e.target.value)}
							required
						/>
					</div>
					<div className="form-buttons">
						<button onClick={() => setLogType(null)}>Back</button>
						<button type="submit">Submit</button>
					</div>
				</form>
			);
		}
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<div className="modal-header">
					<h2>Add Log</h2>
					<button className="close-button" onClick={onClose}>
						X
					</button>
				</div>
				<div className="modal-body">
					{logType === null ? (
						<>
							<h3>Select Log Type:</h3>
							<div className="add-logs-type-button">
								<button onClick={() => setLogType("food")}>Food</button>
								<button onClick={() => setLogType("exercise")}>Exercise</button>
							</div>
						</>
					) : (
						<>{renderForm()}</>
					)}
				</div>
			</div>
		</div>
	);
}

export default AddLogModal;
