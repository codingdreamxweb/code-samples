import Image from "next/image";
import saveIcon from "@/assets/svg/icons/floppy-gray.svg";
import cancelIcon from "@/assets/svg/icons/close-small.svg";
import { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";
import {
  updateChartTable,
  setModal,
  setNewProduct,
  blockUI,
} from "@/redux/actions";
import { isNarrowScreen } from "@/helper/index";
import { Autocomplete, TextField } from "@mui/material";
import { ProductsFirebase } from "@/firebase/products";
import { v4 } from "uuid";
import { debounce } from "lodash";
import linkIcon from "@/assets/svg/icons/link2.svg";
import Link from "next/link";
import { UserDataFirebase } from "@/firebase/userData";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";

function ChartItemNew({
  user,
  product,
  table,
  newProduct,
  setNewProduct,
  setModal,
  updateChartTable,
  blockUI,
}) {
  const newItemMobileRef = useRef(null);
  const firstInputMobileRef = useRef(null);
  const firstInputDesktopRef = useRef(null);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [canSave, setCanSave] = useState(true);
  const { t } = useTranslation("common");

  const productIndex = table.products.findIndex((p) => p.id === product.id);

  useEffect(() => {
    if (newItemMobileRef.current) {
      newItemMobileRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (firstInputMobileRef.current) {
      firstInputMobileRef.current.focus();
    }
    if (firstInputDesktopRef.current) {
      firstInputDesktopRef.current.focus();
    }
  }, [newProduct.id]);

  useEffect(() => {
    if (!matchedProducts.length) {
      setNewProduct({
        ...newProduct,
        id: v4(),
        type: null,
        pid: null,
        vendor: "",
      });
    }
  }, [matchedProducts]);

  const onChangeNewProduct = (e) => {
    const { field } = e.target.dataset;
    const { value } = e.target;
    if ((field === "plannedCost" || field === "price") && value < 0) {
      return;
    }
    setNewProduct({
      ...newProduct,
      [field]: value,
    });
  };

  const searchProduct = debounce(async (searchString) => {
    const res = await ProductsFirebase.query({
      searchString,
      active: true,
      hitsPerPage: 100,
    });
    setMatchedProducts(res.docs);
    setCanSave(true);
  }, 1000);

  const onProductNameChange = async (e) => {
    e.preventDefault();
    const text = e.target.value;
    if (text.length > 2) {
      setCanSave(false);
      await searchProduct(text);
    }
    setNewProduct({ ...newProduct, name: text });
  };

  const onAutoCompleteChange = async (e, option) => {
    if (e.code === "Enter") {
      onSaveNewProduct(e);
      return;
    }
    setSelectedOption(option);
    if (option) {
      const selectedProduct = matchedProducts.find(
        (p) => p.objectID === option.id
      );
      blockUI(true);
      let userData;
      try {
        userData = await UserDataFirebase.getOne(selectedProduct.uid);
      } catch (error) {
        console.error(error);
      }
      blockUI(false);
      setNewProduct({
        ...newProduct,
        id: v4(),
        pid: selectedProduct.objectID,
        name: selectedProduct.name,
        vendor: userData && userData.userName ? userData.userName : "",
        price: selectedProduct.price,
        type: selectedProduct.type,
        link: "",
      });
    } else {
      setNewProduct({
        ...newProduct,
        id: v4(),
        pid: null,
        type: null,
        name: "",
        vendor: "",
        price: "",
        link: "",
      });
    }
  };

  const onCancelNewProduct = (e) => {
    e.preventDefault();
    setNewProduct({});
  };

  const onSaveNewProduct = (e) => {
    e.preventDefault();
    if (!user) {
      setModal("auth/login-required", {
        message: t("to have an ability of making changes in Charts."),
      });
      return;
    }
    if (table.default) {
      setModal("charts/duplicate-required");
      return;
    }
    if (!canSave) return;

    const { index, ...cleanedProduct } = newProduct;

    const newTable = structuredClone(table);
    cleanedProduct.price = Number(cleanedProduct.price);
    cleanedProduct.plannedCost = Number(cleanedProduct.plannedCost);
    newTable.products.splice(productIndex + 1, 0, cleanedProduct);

    updateChartTable(newTable);
    setNewProduct({});
  };

  if (isNarrowScreen()) {
    return (
      <form
        className="chart-mobile"
        ref={newItemMobileRef}
        onSubmit={onSaveNewProduct}
      >
        <header className="chart-mobile__header">
          {t("New Item")}
          <div className="chart-mobile__buttons">
            <button onClick={onSaveNewProduct} disabled={!canSave}>
              <Image width={20} src={saveIcon} alt="Save Icon" />
            </button>
            <button onClick={onCancelNewProduct}>
              <Image width={30} src={cancelIcon} alt="Cancel Icon" />
            </button>
          </div>
        </header>
        <div className="chart-mobile__content">
          <ul className="chart-mobile-list">
            <li className="chart-mobile-list__item">
              <strong className="chart-mobile-list__heading">
                {t("Name")}:
              </strong>
              <Autocomplete
                disablePortal
                clearOnEscape
                freeSolo
                sx={{
                  maxWidth: 350,
                  flex: 1,
                  ".MuiAutocomplete-inputRoot": {
                    padding: "0 30px 0 10px",
                    borderRadius: "5px",
                  },
                  ".MuiAutocomplete-input": {
                    height: "32px",
                    padding: "0 !important",
                  },
                }}
                options={matchedProducts.map((p) => ({
                  label: p.name,
                  id: p.objectID,
                }))}
                renderInput={(params) => (
                  <TextField
                    variant="outlined"
                    {...params}
                    onChange={onProductNameChange}
                    autoFocus
                    sx={{ backgroundColor: "#fff" }}
                    inputRef={firstInputMobileRef}
                  />
                )}
                value={selectedOption}
                onChange={onAutoCompleteChange}
              />
            </li>
            <li className="chart-mobile-list__item">
              <strong className="chart-mobile-list__heading">
                {t("Vendor")}:
              </strong>
              <input
                type="text"
                onChange={onChangeNewProduct}
                value={newProduct.vendor}
                data-field="vendor"
                className="chart-mobile-list__input"
                disabled={newProduct.pid}
              />
            </li>
            <li className="chart-mobile-list__item">
              <strong className="chart-mobile-list__heading">
                {t("Planed Price")}:
              </strong>
              <input
                type="number"
                onChange={onChangeNewProduct}
                value={newProduct.plannedCost}
                data-field="plannedCost"
                className="chart-mobile-list__input"
              />
            </li>
            <li className="chart-mobile-list__item">
              <strong className="chart-mobile-list__heading">
                {t("Cost")}:
              </strong>
              <input
                type="number"
                onChange={onChangeNewProduct}
                value={newProduct.price}
                data-field="price"
                className="chart-mobile-list__input"
                disabled={newProduct.pid}
              />
            </li>
            <li className="chart-mobile-list__item">
              <strong className="chart-mobile-list__heading">
                {t("Paid by")}:
              </strong>
              <input
                type="text"
                onChange={onChangeNewProduct}
                value={newProduct.paidBy}
                data-field="paidBy"
                className="chart-mobile-list__input"
              />
            </li>
            <li className="chart-mobile-list__item">
              <strong className="chart-mobile-list__heading">
                {t("Link")}:
              </strong>
              {newProduct.pid ? (
                <Link
                  target="_blank"
                  href={`/marketplace/${newProduct.type}/${newProduct.pid}`}
                >
                  <Image src={linkIcon} alt="Link Icon" />
                </Link>
              ) : (
                <input
                  type="text"
                  onChange={onChangeNewProduct}
                  value={newProduct.link}
                  data-field="link"
                  className="chart-mobile-list__input"
                />
              )}
            </li>
            <li className="chart-mobile-list__item">
              <strong className="chart-mobile-list__heading">
                {t("Notes")}:
              </strong>
            </li>
            <li className="chart-mobile-list__item">
              <textarea
                onChange={onChangeNewProduct}
                value={newProduct.note}
                data-field="note"
                className="chart-mobile-list__textarea"
              />
            </li>
          </ul>
        </div>
      </form>
    );
  }

  return (
    <tr className="table-new-row">
      <td>
        <div className="editable-buttons">
          <button
            className="editable-btn"
            onClick={onSaveNewProduct}
            disabled={!canSave}
          >
            <Image width={20} src={saveIcon} alt="Save Icon" />
          </button>
          <button className="editable-btn" onClick={onCancelNewProduct}>
            <Image width={30} src={cancelIcon} alt="Cancel Icon" />
          </button>
        </div>
      </td>
      <td>
        <Autocomplete
          disablePortal
          clearOnEscape
          freeSolo
          sx={{
            maxWidth: 350,
            flex: 1,
            ".MuiAutocomplete-inputRoot": {
              height: 37,
              padding: "0 30px 0 10px",
              borderRadius: "5px",
              width: "200px",
            },
          }}
          options={matchedProducts.map((p) => ({
            label: p.name,
            id: p.objectID,
          }))}
          renderInput={(params) => (
            <TextField
              placeholder={t("Product name")}
              variant="outlined"
              {...params}
              onChange={onProductNameChange}
              sx={{ backgroundColor: "#fff" }}
              inputRef={firstInputDesktopRef}
            />
          )}
          value={selectedOption}
          onChange={onAutoCompleteChange}
        />
      </td>
      <td>
        <form onSubmit={onSaveNewProduct}>
          <input
            type="text"
            onChange={onChangeNewProduct}
            value={newProduct.vendor}
            data-field="vendor"
            className="table-new-row__input table-new-row__input--vendor"
            placeholder={t("Vendor")}
            disabled={newProduct.pid}
          />
        </form>
      </td>
      <td>
        <form onSubmit={onSaveNewProduct}>
          <input
            type="number"
            onChange={onChangeNewProduct}
            value={newProduct.plannedCost}
            data-field="plannedCost"
            className="table-new-row__input table-new-row__input--planned"
            placeholder={t("Planned Price")}
          />
        </form>
      </td>
      <td>
        <form onSubmit={onSaveNewProduct}>
          <input
            type="number"
            onChange={onChangeNewProduct}
            value={newProduct.price}
            data-field="price"
            className="table-new-row__input"
            placeholder={t("Cost")}
            disabled={newProduct.pid}
          />
        </form>
      </td>
      <td>
        <form onSubmit={onSaveNewProduct}>
          <input
            type="text"
            onChange={onChangeNewProduct}
            value={newProduct.paidBy}
            data-field="paidBy"
            className="table-new-row__input table-new-row__input--paid-by"
            placeholder={t("Paid By")}
          />
        </form>
      </td>
      <td>
        <form onSubmit={onSaveNewProduct}>
          <input
            type="text"
            onChange={onChangeNewProduct}
            value={newProduct.note}
            data-field="note"
            className="table-new-row__input table-new-row__input--note"
            placeholder={t("Note")}
          />
        </form>
      </td>
      <td>
        {newProduct.pid ? (
          <Link
            target="_blank"
            href={`/marketplace/${newProduct.type}/${newProduct.pid}`}
          >
            <Image src={linkIcon} alt="Link Icon" />
          </Link>
        ) : (
          <form onSubmit={onSaveNewProduct}>
            <input
              type="text"
              onChange={onChangeNewProduct}
              value={newProduct.link}
              data-field="link"
              className="table-new-row__input"
              placeholder={t("Link")}
            />
          </form>
        )}
      </td>
    </tr>
  );
}

ChartItemNew.propTypes = {
  user: PropTypes.object,
  product: PropTypes.object.isRequired,
  table: PropTypes.object.isRequired,
  newProduct: PropTypes.object.isRequired,
  setNewProduct: PropTypes.func.isRequired,
  setModal: PropTypes.func.isRequired,
  updateChartTable: PropTypes.func.isRequired,
  blockUI: PropTypes.func.isRequired,
};
export default connect(
  ({ mainReducer, chartsReducer }) => ({
    user: mainReducer.user,
    newProduct: chartsReducer.newProduct,
  }),
  {
    updateChartTable,
    setModal,
    setNewProduct,
    blockUI,
  }
)(ChartItemNew);
