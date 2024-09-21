import filterIcon from "../assets/filter.svg";
import sortIcon from "../assets/sort.svg";

function Log() {
	return (
		<div className="log">
			<div className="list-header">
				<h2>Logs</h2>
				<div className="log-buttons">
					<button className="filter-button">
						Filter
						<img src={filterIcon} alt="Filter Icon" />
					</button>
					<button className="sort-button">
						Sort
						<img src={sortIcon} alt="Sort Icon" />
					</button>
				</div>
			</div>
		</div>
	);
}

export default Log;
