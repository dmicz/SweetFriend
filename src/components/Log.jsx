import { useState, useEffect } from "react";
import filterIcon from "../assets/filter.svg";
import sortIcon from "../assets/sort.svg";
import "../styles/Log.css";
import List from "./List";

const itemsData = [
	{
		name: "Running",
		type: "exercise",
		timestamp: new Date("2024-09-21T20:01:00"),
		starred: true,
	},
	{
		name: "Banana",
		type: "food",
		timestamp: new Date("2024-09-21T08:15:00"),
		starred: false,
	},
	{
		name: "Yoga",
		type: "exercise",
		timestamp: new Date("2024-09-21T17:30:00"),
		starred: false,
	},
	{
		name: "Apple",
		type: "food",
		timestamp: new Date("2024-09-21T12:45:00"),
		starred: true,
	},
];

function Log() {
	const [items, setItems] = useState(itemsData);
	const [allItems, setAllItems] = useState(itemsData);
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState({
		food: true,
		exercise: true,
		starred: false,
	});

	useEffect(() => {
		const fetchLogEntries = async () => {
			try {
				const response = await fetch("/api/log_entries");
				const data = await response.json();
				if (data.status === "success") {
					setItems(data.entries);
					setAllItems(data.entries);
				} else {
					console.error("Failed to fetch entries:", data.message);
				}
			} catch (error) {
				console.error("Error fetching log entries:", error);
			}
		};

		fetchLogEntries();
	}, []);


	// Handle sorting items by name
	const sortItemsByName = () => {
		const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
		setItems(sortedItems);
	};

	// Handle filtering items by type or starred
	const applyFilters = () => {
		let filteredItems = allItems;

		if (!filters.food) {
			filteredItems = filteredItems.filter((item) => item.type !== "food");
		}
		if (!filters.exercise) {
			filteredItems = filteredItems.filter((item) => item.type !== "exercise");
		}
		if (filters.starred) {
			filteredItems = filteredItems.filter((item) => item.starred);
		}

		setItems(filteredItems);
	};

	// Handle filter toggle (show/hide filter dialog)
	const toggleFilters = () => {
		setShowFilters(!showFilters);
	};

	// Handle checkbox filter changes
	const handleFilterChange = (e) => {
		const { name, checked } = e.target;
		setFilters((prevFilters) => ({ ...prevFilters, [name]: checked }));
	};

	// Toggle the starred state of an item
	const toggleStar = (index) => {
		const updatedItems = [...items];
		updatedItems[index].starred = !updatedItems[index].starred; // Toggle starred
		setItems(updatedItems);
	};

	return (
		<div className="log">
			<div className="list-header">
				<h2>Logs</h2>
				<div className="log-buttons">
					{/* Filter Button */}
					<button className="filter-button" onClick={toggleFilters}>
						Filter
						<img src={filterIcon} alt="Filter Icon" />
					</button>

					{/* Sort Button */}
					<button className="sort-button" onClick={sortItemsByName}>
						Sort
						<img src={sortIcon} alt="Sort Icon" />
					</button>
				</div>
			</div>

			{/* Filter Dialog */}
			{showFilters && (
				<div className="filter-dialog">
					<label>
						<input
							type="checkbox"
							name="food"
							checked={filters.food}
							onChange={handleFilterChange}
						/>
						Food
					</label>
					<label>
						<input
							type="checkbox"
							name="exercise"
							checked={filters.exercise}
							onChange={handleFilterChange}
						/>
						Exercise
					</label>
					<label>
						<input
							type="checkbox"
							name="starred"
							checked={filters.starred}
							onChange={handleFilterChange}
						/>
						Starred
					</label>
					<button onClick={applyFilters}>Apply Filters</button>
				</div>
			)}

			{/* List of Items */}
			<List items={items} limit={5} toggleStar={toggleStar} />
		</div>
	);
}

export default Log;
