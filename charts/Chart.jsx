import React, { useState, useRef, useEffect } from "react";
import ChartItem from "@/components/charts/ChartItem";
import searchIcon from "@/assets/svg/icons/search2.svg";
import Image from "next/image";
import { MenuItem, FormControl, Select } from "@mui/material";
import { isNarrowScreen } from "@/helper/index";
import { v4 } from "uuid";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { setNewProduct, setGroups } from "@/redux/actions";
import ChartItemNew from "@/components/charts/ChartItemNew";
import { getChartTableGroups } from "@/helper/charts";
import { useTranslation } from "next-i18next";

function Chart({ table, groups, newProduct, setNewProduct, setGroups }) {
  const [searchOption, setSearchOption] = useState("name");
  const [searchField, setSearchField] = useState("");
  const [searchTerm, setSearchTerm] = useState(false);
  const searchInputRef = useRef(null);
  const ssrRef = useRef(true);
  const { t } = useTranslation("common");

  useEffect(() => {
    if (!ssrRef.current) {
      setGroups(getChartTableGroups(table));
    }

    return () => (ssrRef.current = false);
  }, [table]);

  const onAddNewProduct = (previousProduct, previousProductIndex) => {
    const group = previousProduct
      ? previousProduct.group
        ? previousProduct.group
        : ""
      : "";
    const index =
      typeof previousProductIndex === "number"
        ? previousProductIndex + 1
        : table.products.length;
    setNewProduct({
      id: v4(),
      pid: null,
      type: null,
      name: "",
      vendor: "",
      plannedCost: "",
      price: "",
      paidBy: "",
      note: "",
      link: "",
      group,
      index,
    });
  };

  const onSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInputRef.current.value);
    setSearchField(searchOption);
  };

  const searchFilter = (product) =>
    !searchTerm ||
    product[searchField].toLowerCase().includes(searchTerm.toLowerCase());

  const sortByGroup = (a, b) => {
    if (!a.group && b.group) return 1;
    return a.group === b.group ? 1 : -1;
  };

  table.products.sort(groups.length > 1 ? sortByGroup : () => {}); // sort products by group

  const showNewProduct =
    !table.products.length && Object.keys(newProduct).length;

  const tableView = (
    <div className="table-wrapper">
      <table className="table table--chart">
        <thead>
          <tr>
            <th></th>
            <th>{t("Product name")}</th>
            <th>{t("Vendor")}</th>
            <th>{t("Planned price")}</th>
            <th>{t("Cost")}</th>
            <th>{t("Paid by")}</th>
            <th>{t("Notes")}</th>
            <th>{t("Link")}</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody data-group={group} key={group}>
            {groups.length > 1 || group !== "Other" ? (
              <tr className="table__group-name">
                <td colSpan="8">{t(group)}</td>
              </tr>
            ) : null}
            {table.products
              .filter((p) =>
                p.group ? p.group === group : !p.group && group === "Other"
              )
              .filter(searchFilter)
              .map((product) => (
                <React.Fragment key={product.id}>
                  <ChartItem
                    product={product}
                    table={table}
                    onAddNewProduct={onAddNewProduct}
                  />
                </React.Fragment>
              ))}
          </tbody>
        ))}
        {showNewProduct ? <ChartItemNew product={{}} table={table} /> : null}
      </table>
    </div>
  );

  const listView = (
    <ul>
      {groups.map((group) => (
        <React.Fragment key={group}>
          {groups.length > 1 || group !== "Other" ? <li>{group}</li> : null}
          {table.products
            .filter((p) =>
              p.group ? p.group === group : !p.group && group === "Other"
            )
            .filter(searchFilter)
            .map((product) => (
              <React.Fragment key={product.id}>
                <ChartItem
                  product={product}
                  table={table}
                  onAddNewProduct={onAddNewProduct}
                />
              </React.Fragment>
            ))}
        </React.Fragment>
      ))}
      {showNewProduct ? <ChartItemNew product={{}} table={table} /> : null}
    </ul>
  );

  return (
    <div className="chart">
      <form className="searching-block" onSubmit={onSearch}>
        <FormControl
          variant="outlined"
          size="small"
          sx={{
            m: 1,
            height: "39px",
            minWidth: "160px",
            margin: "0 0 0 -1px",
          }}
        >
          <Select
            value={searchOption}
            onChange={(e) => setSearchOption(e.target.value)}
            sx={{ borderRadius: "70px" }}
          >
            <MenuItem value="name">{t("Product name")}</MenuItem>
            <MenuItem value="vendor">{t("Vendor")}</MenuItem>
          </Select>
        </FormControl>
        <input
          type="text"
          className="searching-block__input"
          ref={searchInputRef}
        />
        <button className="searching-block__btn">
          <Image
            width={26}
            height={24}
            src={searchIcon}
            alt="search-wedding-items-for-sale-budgetyid"
          />
        </button>
      </form>
      {isNarrowScreen() ? listView : tableView}
      <div className="chart__buttons">
        <button
          className="btn"
          onClick={(e) => {
            e.preventDefault();
            onAddNewProduct();
          }}
        >
          {`+ ${t("Add item")}`}
        </button>
      </div>
    </div>
  );
}

Chart.propTypes = {
  table: PropTypes.object.isRequired,
  newProduct: PropTypes.object.isRequired,
  setNewProduct: PropTypes.func.isRequired,
  setGroups: PropTypes.func.isRequired,
};
export default connect(
  ({ chartsReducer }) => ({
    newProduct: chartsReducer.newProduct,
    groups: chartsReducer.groups,
  }),
  { setNewProduct, setGroups }
)(Chart);
