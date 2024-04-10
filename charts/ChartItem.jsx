import Image from "next/image";
import moreIcon from "@/assets/svg/icons/dots.svg";
import arrowUpIcon from "@/assets/svg/icons/arrow-up.svg";
import linkIcon from "@/assets/svg/icons/link2.svg";
// import saveIcon from "@/assets/svg/icons/floppy-gray.svg";
// import cancelIcon from "@/assets/svg/icons/close-small.svg";
import { useState } from "react";
import Link from "next/link";
import { connect } from "react-redux";
import { updateChartTable, setModal, setEditProduct } from "@/redux/actions";
import { doGlobalSearch, setGlobalSearchKeyword } from "@/redux/actions"; // why do we need global search actions in Chart Item?
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { styled } from "@mui/material/styles";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import { UserDataFirebase } from "@/firebase/userData";
import { useRouter } from "next/router";
import { isNarrowScreen } from "@/helper/index";
import ChartItemNew from "@/components/charts/ChartItemNew";
import ChartItemEdit from "@/components/charts/ChartItemEdit";
import PropTypes from "prop-types";
import messages from "@/helper/messages";
import { useTranslation } from "next-i18next";

const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: "#95775a",
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#95775a",
    color: "#fff",
    maxWidth: 220,
    fontSize: "15px",
    border: "1px solid #dadde9",
    padding: "10px",
  },
}));

function ChartItem({
  product,
  table,
  user,
  updateChartTable,
  setModal,
  setGlobalSearchKeyword,
  doGlobalSearch,
  newProduct,
  editProduct,
  onAddNewProduct,
  setEditProduct,
}) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [vendorEmail, setVendorEmail] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation("common");
  const router = useRouter();

  const onTooltip = async () => {
    if (!product.uid) {
      return;
    }
    if (vendorEmail) {
      setIsTooltipOpen(true);
    } else {
      const user = await UserDataFirebase.getOne(product.uid);
      if (user?.email) {
        setVendorEmail(user.email);
        setIsTooltipOpen(true);
      }
    }
  };

  const productIndex = table.products.findIndex((p) => p.id === product.id);

  const onRemove = () => {
    if (!user) {
      setModal("auth/login-required", {
        message: messages.chartsLoginRequired,
      });
      return;
    }
    if (table.default) {
      setModal("charts/duplicate-required");
      return;
    }
    if (product.isFinal) {
      return;
    }
    const newChart = structuredClone(table);
    newChart.products.splice(
      newChart.products.findIndex((p) => p.id === product.id),
      1
    );
    updateChartTable(newChart);
  };

  const onMarkIsFinal = (e) => {
    if (!user) {
      setModal("auth/login-required", {
        message: t("to have an ability of making changes in Charts"),
      });
      return;
    }
    if (table.default) {
      setModal("charts/duplicate-required");
      return;
    }
    const { name } = e.target.dataset;
    if (
      (name === "final" && product.isFinal) ||
      (name === "optional" && !product.isFinal)
    ) {
      return;
    }
    const newChart = structuredClone(table);
    newChart.products[productIndex].isFinal =
      !newChart.products[productIndex].isFinal;
    updateChartTable(newChart);
  };

  const onExpand = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const showNewProduct =
    Object.keys(newProduct).length &&
    newProduct.index - 1 === productIndex &&
    (newProduct.group === product.group ||
      (!newProduct.group && !product.group));

  const showEditProduct =
    Object.keys(editProduct).length &&
    editProduct.id === table.products[productIndex].id;

  if (isNarrowScreen()) {
    return (
      <>
        {showEditProduct ? (
          <ChartItemEdit product={product} table={table} />
        ) : (
          <li
            className={`chart-mobile ${
              product.isFinal ? "chart-mobile--final" : ""
            }`}
            style={isMenuVisible ? { zIndex: 2 } : null}
          >
            <header
              className="chart-mobile__header"
              style={product.isFinal ? { fontWeight: "bold" } : null}
            >
              <ClickAwayListener onClickAway={() => setIsMenuVisible(false)}>
                <div className="chart-mobile__menu">
                  <button onClick={() => setIsMenuVisible(!isMenuVisible)}>
                    <Image src={moreIcon} alt="More Icon" />
                  </button>
                  <ul
                    className="table-drop-menu"
                    style={isMenuVisible ? null : { display: "none" }}
                    onClick={() => setIsMenuVisible(false)}
                  >
                    <li
                      className={`table-drop-menu__item ${
                        product.isFinal ? "table-drop-menu__item--disabled" : ""
                      }`}
                      onClick={onRemove}
                    >
                      {t("Remove an item")}
                    </li>
                    <li
                      className="table-drop-menu__item"
                      onClick={() => onAddNewProduct(product, productIndex)}
                    >
                      {t("Add an item")}
                    </li>
                    <li
                      className="table-drop-menu__item"
                      onClick={() => setEditProduct(product)}
                    >
                      {t("Edit an item")}
                    </li>
                    <li
                      className={`table-drop-menu__item ${
                        !product.isFinal
                          ? "table-drop-menu__item--disabled"
                          : ""
                      }`}
                      data-name="optional"
                      onClick={onMarkIsFinal}
                    >
                      {t("Mark as optional")}
                    </li>
                    <li
                      className={`table-drop-menu__item ${
                        product.isFinal ? "table-drop-menu__item--disabled" : ""
                      }`}
                      data-name="final"
                      onClick={onMarkIsFinal}
                    >
                      {t("Mark as final")}
                    </li>
                  </ul>
                </div>
              </ClickAwayListener>
              <span
                onClick={() => {
                  setGlobalSearchKeyword(product.name);
                  router.push("/search").then(() => {
                    doGlobalSearch();
                  });
                }}
              >
                {product.name}
              </span>
              <button
                onClick={onExpand}
                className={`chart-mobile__expander ${
                  isExpanded ? "" : "chart-mobile__expander--expanded"
                }`}
              >
                <Image width={16} src={arrowUpIcon} alt="Arrow Up Icon" />
              </button>
            </header>
            {isExpanded ? (
              <div className="chart-mobile__content">
                <ul className="chart-mobile-list">
                  <li className="chart-mobile-list__item">
                    <strong className="chart-mobile-list__heading">
                      {t("Vendor")}:
                    </strong>
                    {product.vendor}
                  </li>
                  <li className="chart-mobile-list__item">
                    <strong className="chart-mobile-list__heading">
                      {t("Planed Price")} :
                    </strong>
                    $ {product.plannedCost}
                  </li>
                  <li className="chart-mobile-list__item">
                    <strong className="chart-mobile-list__heading">
                      {t("Cost")} :
                    </strong>
                    $ {product.price}
                  </li>
                  <li className="chart-mobile-list__item">
                    <strong className="chart-mobile-list__heading">
                      {t("Paid by")} :
                    </strong>
                    {product.paidBy}
                  </li>
                  <li className="chart-mobile-list__item chart-mobile-list__item--notes">
                    <strong className="chart-mobile-list__heading">
                      {t("Notes")} :
                    </strong>
                    {product.pid ? (
                      <Link
                        target="_blank"
                        href={`/marketplace/${product.type}/${product.pid}`}
                      >
                        <Image src={linkIcon} alt="Link Icon" />
                      </Link>
                    ) : product.link ? (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={
                          product.link.startsWith("http")
                            ? product.link
                            : `https://${product.link}`
                        }
                      >
                        <Image src={linkIcon} alt="Link Icon" />
                      </a>
                    ) : null}
                  </li>
                  <li className="chart-mobile-list__item chart-mobile-list__item--notes">
                    {product.note}
                  </li>
                </ul>
              </div>
            ) : null}
          </li>
        )}
        {showNewProduct ? (
          <ChartItemNew product={product} table={table} />
        ) : null}
      </>
    );
  }

  return (
    <>
      {showEditProduct ? (
        <ChartItemEdit product={product} table={table} />
      ) : (
        <tr className={product.isFinal ? "table--row-final" : ""}>
          <ClickAwayListener onClickAway={() => setIsMenuVisible(false)}>
            <td>
              <button onClick={() => setIsMenuVisible(!isMenuVisible)}>
                <Image src={moreIcon} alt="More Icon" />
              </button>
              <ul
                className="table-drop-menu"
                style={isMenuVisible ? null : { display: "none" }}
                onClick={() => setIsMenuVisible(false)}
              >
                <li
                  className={`table-drop-menu__item ${
                    product.isFinal ? "table-drop-menu__item--disabled" : ""
                  }`}
                  onClick={onRemove}
                >
                  {t("Remove an item")}
                </li>
                <li
                  className="table-drop-menu__item"
                  onClick={() => onAddNewProduct(product, productIndex)}
                >
                  {t("Add an item")}
                </li>
                <li
                  className="table-drop-menu__item"
                  onClick={() => setEditProduct(product)}
                >
                  {t("Edit an item")}
                </li>
                <li
                  className={`table-drop-menu__item ${
                    !product.isFinal ? "table-drop-menu__item--disabled" : ""
                  }`}
                  data-name="optional"
                  onClick={onMarkIsFinal}
                >
                  {t("Mark as optional")}
                </li>
                <li
                  className={`table-drop-menu__item ${
                    product.isFinal ? "table-drop-menu__item--disabled" : ""
                  }`}
                  data-name="final"
                  onClick={onMarkIsFinal}
                >
                  {t("Mark as final")}
                </li>
              </ul>
            </td>
          </ClickAwayListener>
          <td>
            <span
              onClick={() => {
                setGlobalSearchKeyword(product.name);
                router.push("/search").then(() => {
                  doGlobalSearch();
                });
              }}
              style={{ cursor: "pointer" }}
            >
              {t(product.name)}
            </span>
          </td>
          <td>
            <div style={{ display: "inline-flex" }}>
              <span>{t(product.vendor)}</span>

              {product.uid ? (
                <ClickAwayListener onClickAway={() => setIsTooltipOpen(false)}>
                  <div>
                    <HtmlTooltip
                      PopperProps={{
                        disablePortal: true,
                      }}
                      onClose={() => setIsTooltipOpen(false)}
                      open={isTooltipOpen}
                      disableFocusListener
                      disableHoverListener
                      disableTouchListener
                      title={vendorEmail}
                    >
                      <button onClick={onTooltip}>
                        <AlternateEmailIcon />
                      </button>
                    </HtmlTooltip>
                  </div>
                </ClickAwayListener>
              ) : null}
            </div>
          </td>
          <td>$ {product.plannedCost}</td>
          <td>$ {product.price}</td>
          <td>{t(product.paidBy)}</td>
          <td>{product.note}</td>
          <td>
            {product.pid ? (
              <Link
                target="_blank"
                href={`/marketplace/${product.type}/${product.pid}`}
              >
                <Image src={linkIcon} alt="Link Icon" />
              </Link>
            ) : product.link ? (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={
                  product.link.startsWith("http")
                    ? product.link
                    : `https://${product.link}`
                }
              >
                <Image src={linkIcon} alt="Link Icon" />
              </a>
            ) : null}
          </td>
        </tr>
      )}
      {showNewProduct ? <ChartItemNew product={product} table={table} /> : null}
    </>
  );
}

ChartItem.propTypes = {
  user: PropTypes.object,
  product: PropTypes.object.isRequired,
  table: PropTypes.object.isRequired,
  updateChartTable: PropTypes.func.isRequired,
  setModal: PropTypes.func.isRequired,
  setGlobalSearchKeyword: PropTypes.func.isRequired,
  doGlobalSearch: PropTypes.func.isRequired,
  newProduct: PropTypes.object.isRequired,
  editProduct: PropTypes.object.isRequired,
  onAddNewProduct: PropTypes.func.isRequired,
  setEditProduct: PropTypes.func.isRequired,
};
export default connect(
  ({ mainReducer, chartsReducer }) => ({
    newProduct: chartsReducer.newProduct,
    editProduct: chartsReducer.editProduct,
    user: mainReducer.user,
  }),
  {
    updateChartTable,
    setModal,
    setGlobalSearchKeyword,
    doGlobalSearch,
    setEditProduct,
  }
)(ChartItem);
