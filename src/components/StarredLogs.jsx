import { useState, useEffect } from "react";
import filterIcon from "../assets/filter.svg";
import sortIcon from "../assets/sort.svg";
import "../styles/Log.css";
import List from "./List";
import Modal from "./Modal";

const placeholderData = [
	{
		name: "Apple",
		type: "food",
		timestamp: new Date("2024-09-21T12:45:00"),
		starred: true,
		details: { total_carbs: 25 },
	},
	{
		name: "Running",
		type: "exercise",
		timestamp: new Date("2024-09-21T20:01:00"),
		starred: true,
		details: { time_spent: 60, intensity_level: "High" },
	},
];

function StarredLogs() {
	const [items, setItems] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null); // State to track the selected item

	useEffect(() => {
		// Use placeholder data for starred items
		const starredItems = placeholderData.filter(item => item.starred);
		setItems(starredItems);
	}, []);

	// Handle sorting items by name
	const sortItemsByName = () => {
		const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
		setItems(sortedItems);
	};

	// Toggle the starred state of an item
	const toggleStar = (index) => {
		const updatedItems = [...items];
		updatedItems[index].starred = !updatedItems[index].starred; // Toggle starred
		setItems(updatedItems);
	};

	// Function to show the modal with the selected item details
	const handleItemClick = (item) => {
		setSelectedItem(item);
	};

	// Function to close the modal
	const closeModal = () => {
		setSelectedItem(null);
	};

	return (
		<div className="log">
			<div className="list-header">
				<h2>Starred Logs</h2>
				<div className="log-buttons">
					{/* Sort Button */}
					<button className="sort-button" onClick={sortItemsByName}>
						Sort
						<img src={sortIcon} alt="Sort Icon" />
					</button>
				</div>
			</div>

			{/* List of Starred Items */}
			<List
				items={items}
				limit={5}
				toggleStar={toggleStar}
				onItemClick={handleItemClick}
			/>

			{/* Modal for displaying item details */}
			{selectedItem && <Modal item={selectedItem} onClose={closeModal} />}
		</div>
	);
}

export default StarredLogs;
