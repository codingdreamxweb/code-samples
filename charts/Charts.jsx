import { useEffect, useRef } from "react";
import { connect } from "react-redux";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chart from "@/components/charts/Chart";
import ChartsTab from "@/components/charts/ChartsTab";
import Loading from "@/components/Loading";
import { isTouchDevice } from "@/helper/index";
import { setCurrentTableId } from "@/redux/actions";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";

function Charts({ tables, isLoading, currentTableId, setCurrentTableId }) {
  const ssrRef = useRef(true);

  const { t } = useTranslation("common");
  useEffect(() => {
    if (!ssrRef.current) {
      if (tables.length) {
        if (
          !currentTableId ||
          !tables.map((t) => t.id).includes(currentTableId)
        ) {
          setCurrentTableId(tables[0].id);
        }
      }
    }
    return () => (ssrRef.current = false);
  }, [tables]);

  if (isLoading) return <Loading />;

  if (!tables.length) return <span>{t("No categories yet...")}</span>;

  const table = tables.find((t) => t.id === currentTableId);

  return (
    <section className="charts">
      <div className="chart-tabs">
        <Box>
          <Tabs
            value={currentTableId}
            variant="scrollable"
            scrollButtons={isTouchDevice() ? false : "auto"}
            aria-label="scrollable tabs for Charts names"
          >
            {tables.map((table) => (
              <Tab
                key={table.id}
                label={t(table.name)}
                value={table.id}
                component={() => <ChartsTab table={table} />}
              />
            ))}
          </Tabs>
        </Box>
      </div>
      {table ? <Chart table={table} /> : null}
    </section>
  );
}

Charts.propTypes = {
  tables: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  currentTableId: PropTypes.string.isRequired,
  setCurrentTableId: PropTypes.func.isRequired,
};

export default connect(
  ({ chartsReducer }) => ({
    tables: chartsReducer.tables,
    isLoading: chartsReducer.isLoading,
    currentTableId: chartsReducer.currentTableId,
  }),
  { setCurrentTableId }
)(Charts);
