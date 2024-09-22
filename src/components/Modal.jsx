import { format } from "date-fns"; // Import format from date-fns
import "../styles/Modal.css"; // Add CSS for modal styling
import PropTypes from "prop-types";

function Modal({ item, onClose }) {
	// prop validation
	Modal.propTypes = {
		item: PropTypes.shape({
			name: PropTypes.string.isRequired,
			type: PropTypes.oneOf(["food", "exercise"]).isRequired,
			timestamp: PropTypes.instanceOf(Date).isRequired,
			starred: PropTypes.bool.isRequired,
			details: PropTypes.object.isRequired, // details prop added
		}).isRequired,
		onClose: PropTypes.func.isRequired,
	};

	// Helper function to render details with the label on top and value below
	const renderDetails = () => {
		if (item.type === "food") {
			return (
				<>
					<div className="detail-item">
						<p>Total Carbs:</p>
						<p>{item.details.total_carbs}g</p>
					</div>
				</>
			);
		} else if (item.type === "exercise") {
			return (
				<>
					<div className="detail-item">
						<p>Time Spent:</p>
						<p>{item.details.time_spent} minutes</p>
					</div>
					<div className="detail-item">
						<p>Intensity Level:</p>
						<p>{item.details.intensity_level}</p>
					</div>
				</>
			);
		}
		return null;
	};

	// Format the timestamp
	const formattedTimestamp = format(item.timestamp, "h:mm a, d MMM yyyy");

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<div className="modal-header">
					<h2>Details</h2>
					<button className="close-button" onClick={onClose}>
						X
					</button>
				</div>
				<div className="modal-body">
					<h3>{item.name}</h3>
					<div className="sub-details">
						<div className="detail-item">
							<p>Type:</p>
							<p>{item.type}</p>
						</div>
						<div className="detail-item">
							<p>Timestamp:</p>
							<p>{formattedTimestamp}</p>
						</div>
						<div className="detail-item">
							<p>Starred:</p>
							<p>{item.starred ? "Yes" : "No"}</p>
						</div>
						{/* Render item-specific details */}
						{renderDetails()}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Modal;
