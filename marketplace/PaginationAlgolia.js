import Image from "next/image";
import PropTypes from "prop-types";
import leftArrow from "@/assets/svg/icons/chevron-left.svg";
import rightArrow from "@/assets/svg/icons/chevron-right.svg";

const STEP = 2;

const Pagination = ({ action, page, totalPages }) => {
  const currentPage = page + 1; // pages in algolia are zero based
  const canGoPrev = page > 0;
  const canGoNext = currentPage < totalPages;
  const lastNextPage =
    totalPages > currentPage + STEP ? currentPage + STEP : totalPages;
  const lastPrevPage = currentPage - STEP > 1 ? currentPage - STEP : 1;
  const pages = Array.from(Array(totalPages).keys()).slice(
    lastPrevPage - 1,
    lastNextPage
  );

  if(totalPages < 2) {
    return null;
  }

  return (
    <nav aria-label="Page navigation" className="pagination-holder">
      <ul className="pagination">
        <li className="pagination__item">
          <button
            className={`pagination__button ${
              canGoPrev ? "" : "pagination__button--disabled"
            }`}
            onClick={(e) => {
              e.preventDefault();
              if (canGoPrev) {
                action(page - 1);
              }
            }}
          >
            <Image src={leftArrow} alt="Left pagination arrow" />
          </button>
        </li>
        {pages.map((p) => {
          if (p === page) {
            return (
              <li className="pagination__item" key={p}>
                <strong className="pagination__current">{p + 1}</strong>
              </li>
            );
          }

          return (
            <li className="pagination__item" key={p}>
              <button
                className="pagination__button"
                onClick={(e) => {
                  e.preventDefault();
                  action(p);
                }}
              >
                {p + 1}
              </button>
            </li>
          );
        })}
        <li className="pagination__item">
          <button
            className={`pagination__button ${
              canGoNext ? "" : "pagination__button--disabled"
            }`}
            onClick={(e) => {
              e.preventDefault();
              if (canGoNext) {
                action(page + 1);
              }
            }}
          >
            <Image src={rightArrow} alt="Right pagination arrow" />
          </button>
        </li>
      </ul>
    </nav>
  );
};

Pagination.propTypes = {
  action: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
};

export default Pagination;
