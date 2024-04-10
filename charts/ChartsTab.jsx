import { connect } from "react-redux";
import { setCurrentTableId, setModal } from "@/redux/actions";
import Image from "next/image";
import trashIcon from "@/assets/svg/icons/trash-can.svg";
import writeIcon from "@/assets/svg/icons/write.svg";
import PropTypes from "prop-types";
import messages from "@/helper/messages";
import { useTranslation } from "next-i18next";
function ChartsTab({
  user,
  table,
  currentTableId,
  setCurrentTableId,
  setModal,
}) {
  const { t } = useTranslation("common");
  const onEdit = (e) => {
    e.preventDefault();
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
    setModal("charts/edit-table-name", { table });
  };
  const onDelete = (e) => {
    e.preventDefault();
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
    setModal("charts/delete-chart-table", { table });
  };

  const onTabsChange = (e) => {
    e.preventDefault();
    setCurrentTableId(table.id);
  };

  return (
    <div
      className={`chart-tabs__item ${
        currentTableId === table.id ? "chart-tabs__item--active" : ""
      }`}
    >
      <button className="chart-tabs__name" onClick={onTabsChange}>
        {t(table.name)}
      </button>
      <div className="chart-tabs__info">
        <strong className="chart-tabs__costs">
          ${table.products.reduce((acc, curr) => acc + Number(curr.price), 0)}
        </strong>
        <div className="chart-tabs__buttons">
          <button className="chart-tabs__button" onClick={onDelete}>
            <Image width={24} height={24} src={trashIcon} alt="Trash Icon" />
          </button>
          <button className="chart-tabs__button" onClick={onEdit}>
            <Image width={24} height={24} src={writeIcon} alt="Pencil Icon" />
          </button>
        </div>
      </div>
    </div>
  );
}

ChartsTab.propTypes = {
  user: PropTypes.object,
  table: PropTypes.object.isRequired,
  currentTableId: PropTypes.string.isRequired,
  setCurrentTableId: PropTypes.func.isRequired,
  setModal: PropTypes.func.isRequired,
};
export default connect(
  ({ mainReducer, chartsReducer }) => ({
    user: mainReducer.user,
    currentTableId: chartsReducer.currentTableId,
  }),
  { setModal, setCurrentTableId }
)(ChartsTab);
