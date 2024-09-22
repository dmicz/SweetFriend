import { useState, useEffect } from "react";
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
	const [manualEntry, setManualEntry] = useState(true); // Track manual entry or image upload
	const [reason, setReason] = useState(""); // Store AI reasoning
	const [isLoading, setIsLoading] = useState(false); // Track loading state
	const [analyzingText, setAnalyzingText] = useState("Analyzing"); // Text cycling state

	// Cycle through "Analyzing", "Analyzing.", "Analyzing..", "Analyzing..."
	useEffect(() => {
		if (isLoading) {
			const interval = setInterval(() => {
				setAnalyzingText((prev) => {
					if (prev === "Analyzing") return "Analyzing.";
					if (prev === "Analyzing.") return "Analyzing..";
					if (prev === "Analyzing..") return "Analyzing...";
					return "Analyzing";
				});
			}, 500); // Change every 500ms

			return () => clearInterval(interval); // Clear interval when no longer loading
		}
	}, [isLoading]);

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
		e.preventDefault(); // Prevent default form submission
		setIsLoading(true); // Start loading state

		const formData = new FormData(e.target);

		try {
			const response = await fetch("/api/analyze_image", {
				method: "POST",
				body: formData,
			});
			const data = await response.json();

			// Assuming API returns { meal_name, total_carbs, reason }
			setName(data.meal_name || ""); // Set the name from AI response
			setTotalCarbs(data.total_carbs || ""); // Set the total carbs from AI response
			setReason(data.reason || ""); // Set the reasoning from AI response
			setIsLoading(false); // Stop loading state
		} catch (error) {
			console.error("Error uploading image:", error);
			setIsLoading(false); // Stop loading on error
		}
	};

	// Render the form dynamically based on the log type and whether it's manual entry or image upload
	const renderForm = () => {
		if (logType === "food") {
			return (
				<>
					{/* Toggle for manual entry or image upload */}
					<div className="food-tabs">
						<button
							className={manualEntry ? "active" : ""}
							onClick={() => setManualEntry(true)}
						>
							Enter Manually
						</button>
						<button
							className={!manualEntry ? "active" : ""}
							onClick={() => setManualEntry(false)}
						>
							Upload Image
						</button>
					</div>

					{/* Only show the relevant form or loading indicator */}
					{isLoading ? (
						<p>{analyzingText}</p>
					) : manualEntry ? (
						// Manual food entry form
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
					) : !name && !totalCarbs ? (
						// Image upload form (disappears after submitting)
						<form onSubmit={handleImageUpload} className="exercise-form">
							<div>
								<label>Upload Food Image:</label>
								<input type="file" name="file" accept="image/*" required />
							</div>
							<div className="form-buttons">
								<button onClick={() => setLogType(null)}>Back</button>
								<button type="submit">Upload</button>
							</div>
						</form>
					) : (
						// Show the form filled with AI response
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
								<label>Total Carbs (g):</label>
								<input
									type="number"
									step="0.1"
									value={totalCarbs}
									onChange={(e) => setTotalCarbs(e.target.value)}
									required
								/>
							</div>
							{/* Conditionally render the reasoning if available */}
							{reason && (
								<div id="reason-box">
									<h4>Reasoning:</h4>
									<p>{reason}</p>
								</div>
							)}
							<div className="form-buttons">
								<button onClick={() => setLogType(null)}>Back</button>
								<button type="submit">Submit</button>
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
