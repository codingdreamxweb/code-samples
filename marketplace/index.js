import Image from "next/image";
import Layout from "@/components/Layout";
import ProductsList from "@/components/ProductsList";
import ContactUs from "@/components/ContactUs";
import Pagination from "@/components/PaginationAlgolia";
import {
  getProducts,
  setMarketplacePriceValue,
  setMarketplaceFacets,
  setModal,
} from "@/redux/actions";
import { connect } from "react-redux";
import { useEffect, useRef, useState } from "react";
import Loading from "@/components/Loading";
import Filters from "@/components/MarketplaceFilters";
import searchIcon from "@/assets/svg/icons/search-large.svg";
import funnetIcon from "@/assets/svg/icons/funnet.svg";
import coverImg from "@/assets/img/covers/homepage.jpg";
import { getTotalMarketplaceFilters } from "@/helper/marketplace";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { productsName } from "@/firebase/config";
import { getProducts as getProductsHelper } from "@/lib/algolia-helper";
import { SellerDataFirebase } from "@/firebase/sellerData";
import { getUsers } from "@/lib/firebase-admin-helper";
import { facetsToFilters, filtersInitialState } from "@/helper/marketplace";

export async function getServerSideProps({ locale }) {
  const response = await getProductsHelper({
    omit: { type: "charity" },
    active: true,
    promoted: false,
  });
  const { docs, ...rest } = response;
  let sellersMap = {};
  const uids = response.facets?.uid ? Object.keys(response.facets.uid) : [];
  if (!Object.keys(sellersMap).length && uids.length) {
    const users = {};
    const usersRes = await getUsers({ uids });
    usersRes.forEach(({ uid, name }) => (users[uid] = name));
    const sellersRes = await SellerDataFirebase.getSellersMap(uids);
    sellersMap = { ...users, ...sellersRes };
  }
  let filters = filtersInitialState;
  facetsToFilters(response, filters.facets, (payload) => {
    filters = {
      ...filters,
      facets: {
        ...filters.facets,
        [payload.name]: payload.facets,
      },
    };
  });

  return {
    props: {
      ...(await serverSideTranslations(locale, ["about-us", "common"])),
      initialReduxState: {
        marketplaceReducer: {
          ...rest,
          products: docs,
          filters,
          sellersMap,
        },
      },
    },
  };
}

function MarketplacePage({
  filters,
  sellersMap,
  products,
  getProducts,
  isLoading,
  setModal,
  setMarketplaceFacets,
  setMarketplacePriceValue,
  page,
  totalPages,
  totalItems,
}) {
  const searchInputRef = useRef(null);
  const contentRef = useRef(null);
  const ssrRef = useRef(true);
  const { t } = useTranslation("common");
  const [index, setIndex] = useState(productsName);

  useEffect(() => {
    if (!ssrRef.current) {
      getProducts({ index });
    }

    return () => (ssrRef.current = false);
  }, [index]);

  const onSearch = (page = 0) => {
    contentRef.current.scrollIntoView({ behavior: "instant" });
    getProducts({ page, index });
  };

  return (
    <Layout>
      <Head>
        <title>{t("Marketplace")}</title>
      </Head>
      <div className="products">
        <div className="page-cover">
          <Image
            width={1440}
            height={447}
            className="page-cover__img"
            src={coverImg}
            alt="Marketplace cover image"
          />
          <h1 className="page-cover__title" style={{ color: "inherit" }}>
            {t("Marketplace")}
          </h1>
        </div>
        <div className="products__main-block" ref={contentRef}>
          <section className="products__content">
            <div className="products__top-block">
              <form
                className="search-block search-block--charity"
                onSubmit={(e) => {
                  e.preventDefault();
                  getProducts({
                    page: 0,
                    searchString: searchInputRef.current.value,
                    index,
                  });
                }}
              >
                <button className="search-block__search-btn">
                  <Image src={searchIcon} alt="Search icon" />
                </button>
                <input
                  className="search-block__search-input"
                  type="text"
                  ref={searchInputRef}
                />
              </form>
            </div>
            {isLoading ? (
              <Loading />
            ) : (
              <>
                <div className="products__controls-block">
                  <button
                    className="products__btn-filters"
                    onClick={(e) => {
                      e.preventDefault();
                      setModal("marketplace/filters", {
                        filters: (
                          <Filters
                            exclude={[]}
                            filters={filters}
                            sellersMap={sellersMap}
                            setFacets={setMarketplaceFacets}
                            setPriceValue={setMarketplacePriceValue}
                            onApply={() => {
                              onSearch();
                              setModal(null);
                            }}
                          />
                        ),
                      });
                    }}
                  >
                    <Image src={funnetIcon} alt="Filters" />
                    <strong>
                      <span>
                        {t("Filters")} ({getTotalMarketplaceFilters(filters)})
                      </span>
                      <em>
                        {" "}
                        {totalItems} {t("items")}
                      </em>
                    </strong>
                  </button>
                  <FormControl>
                    <InputLabel id="sort-by-selectbox">
                      {t("Sort by")}
                    </InputLabel>
                    <Select
                      labelId="sort-by-selectbox"
                      id="sort-by-selectbox"
                      value={index}
                      label="Sort by"
                      onChange={(event) => setIndex(event.target.value)}
                      sx={{
                        borderRadius: "5px",
                        width: "220px",
                      }}
                    >
                      <MenuItem value={productsName}>
                        {t("Date (desc)")}
                      </MenuItem>
                      <MenuItem value={productsName + "_pubDate_asc"}>
                        {t("Date (asc)")}
                      </MenuItem>
                      <MenuItem value={productsName + "_price_desc"}>
                        {t("Price (desc)")}
                      </MenuItem>
                      <MenuItem value={productsName + "_price_asc"}>
                        {t("Price (asc)")}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <ProductsList
                  list={products}
                  showSocial
                  className="products-list--marketplace"
                >
                  {(item) => (
                    <Link
                      href={`/marketplace/${item.type}/${item.objectID}`}
                      className="products-list__btn"
                    >
                      {t("View")}
                    </Link>
                  )}
                </ProductsList>
                <Pagination
                  action={onSearch}
                  page={page}
                  totalPages={totalPages}
                />
              </>
            )}
          </section>
        </div>
      </div>
      <ContactUs />
    </Layout>
  );
}

export default connect(
  ({ marketplaceReducer }) => ({
    filters: marketplaceReducer.filters,
    sellersMap: marketplaceReducer.sellersMap,
    products: marketplaceReducer.products,
    isLoading: marketplaceReducer.isLoading,
    page: marketplaceReducer.page,
    totalPages: marketplaceReducer.totalPages,
    totalItems: marketplaceReducer.totalItems,
    facets: marketplaceReducer.totalItems,
  }),
  {
    getProducts,
    setModal,
    setMarketplaceFacets,
    setMarketplacePriceValue,
  }
)(MarketplacePage);
