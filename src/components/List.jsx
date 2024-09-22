import PropTypes from "prop-types";
import { format } from "date-fns";
import starIcon from "../assets/star.svg";
import starFilledIcon from "../assets/star-filled.svg";
import "../styles/List.css";

function List({ items, limit, toggleStar }) {
	// prop validation
	List.propTypes = {
		items: PropTypes.arrayOf(
			PropTypes.shape({
				name: PropTypes.string.isRequired,
				type: PropTypes.oneOf(["food", "exercise"]).isRequired,
				timestamp: PropTypes.instanceOf(Date).isRequired,
				starred: PropTypes.bool.isRequired,
			})
		).isRequired,
		limit: PropTypes.number,
		toggleStar: PropTypes.func.isRequired,
	};

	// default prop for limit
	List.defaultProps = {
		limit: 5,
	};

	// Formatting timestamp
	const formatTimestamp = (timestamp) =>
		format(timestamp, "h:mm a 'on' do MMMM yyyy");

	// Render the list with formatted items
	return (
		<ul>
			{items.slice(0, limit).map((item, index) => (
				<li key={index} className="list-item">
					<span>{item.name}</span>
					<div className="right-list-item">
						<span>{formatTimestamp(item.timestamp)}</span>
						<span
							onClick={() => toggleStar(index)} // Toggle star on click
							style={{ cursor: "pointer" }}
						>
							<img
								src={item.starred ? starFilledIcon : starIcon}
								alt="Star Icon"
								className="star-icon"
							/>
						</span>
					</div>
				</li>
			))}
		</ul>
	);
}

export default List;
