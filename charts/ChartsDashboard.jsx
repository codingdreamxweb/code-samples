import { useState } from "react";
import { useEffect } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

function ChartsDashboard({ tables, isLoading }) {
  const [actualBudget, setActualBudget] = useState(0);

  useEffect(() => {
    if (tables.length) {
      let actual = 0;
      tables.forEach(
        (table) =>
          (actual += parseFloat(
            table.products.reduce((acc, curr) => acc + Number(curr.price), 0)
          ))
      );
      setActualBudget(actual);
    } else {
      setActualBudget(0);
    }
  }, [tables]);

  return (
    <ul className="charts-dashboard">
      {tables.map((table) => {
        const budget = parseFloat(
          table.products.reduce((acc, curr) => acc + Number(curr.price), 0)
        );
        return (
          <li className="charts-dashboard__item" key={table.id}>
            <div className="charts-dashboard__info">
              <strong>{table.name}</strong>
              <strong>${budget}</strong>
            </div>
            <em className="charts-dashboard__ribbon">
              <span style={{ width: `${budget / (actualBudget / 100)}%` }} />
            </em>
          </li>
        );
      })}
    </ul>
  );
}

ChartsDashboard.propTypes = {
  tables: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
};
export default connect(
  ({ chartsReducer }) => ({
    tables: chartsReducer.tables,
    isLoading: chartsReducer.isLoading,
  }),
  null
)(ChartsDashboard);
