import PropTypes from "prop-types";

function List({ items }) {
	// prop validation
	List.propTypes = {
		items: PropTypes.array.isRequired,
	};

	// rest of the component code
	return (
		<ul>
			{items.map((item, index) => (
				<li key={index}>{item}</li>
			))}
		</ul>
	);
}

export default List;
