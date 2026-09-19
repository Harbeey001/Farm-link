import React, { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ShoppingCart,
  Sprout,
  Wheat,
  Leaf,
  Apple,
  Beef,
  Bird,
  Fish,
  MapPin,
  CheckCircle2,
  Clock3,
  PackageCheck,
  XCircle,
  ArrowRight,
  SlidersHorizontal,
  X,
  Package,
  TrendingUp,
  ShieldCheck,
  ArrowDownUp,
  Filter,
} from "lucide-react";

import { getProducts } from "../services/productService";
import { getMyOrders } from "../services/orderService";
import ProductCard from "../components/ProductCard";
import { getProductImage } from "../utils/productImage";
import { useAuth } from "../context/AuthContext";

const Marketplace = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("available");
  const [sortBy, setSortBy] = useState("newest");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    {
      name: "Crops",
      image: "/crops.png",
      description: "Grains & farm crops",
      icon: Wheat,
    },
    {
      name: "Vegetables",
      image: "/vegetables.png",
      description: "Fresh vegetables",
      icon: Leaf,
    },
    {
      name: "Fruits",
      image: "/fruits.png",
      description: "Farm-grown fruits",
      icon: Apple,
    },
    {
      name: "Livestock",
      image: "/livestock.png",
      description: "Healthy farm animals",
      icon: Beef,
    },
    {
      name: "Poultry",
      image: "/poultry.png",
      description: "Quality poultry",
      icon: Bird,
    },
    {
      name: "Fish",
      image: "/fish.png",
      description: "Fresh farm fish",
      icon: Fish,
    },
  ];

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getProducts();

        if (!ignore) {
          setProducts(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        console.error("Error fetching products:", err);

        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              "Unable to load marketplace products."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      if (user?.role !== "buyer") {
        setOrders([]);
        setOrdersLoading(false);
        setOrdersError("");
        return;
      }

      try {
        setOrdersLoading(true);
        setOrdersError("");

        const response = await getMyOrders();

        if (!ignore) {
          setOrders(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);

        if (!ignore) {
          setOrdersError(
            err?.response?.data?.message ||
              "Unable to load your orders."
          );
        }
      } finally {
        if (!ignore) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    filterProducts();
  }, [
    products,
    search,
    category,
    availability,
    sortBy,
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProducts();

      setProducts(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching products:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load marketplace products."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (user?.role !== "buyer") {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError("");
      return;
    }

    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response = await getMyOrders();

      setOrders(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching orders:", err);

      setOrdersError(
        err?.response?.data?.message ||
          "Unable to load your orders."
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  const filterProducts = () => {
    let result = [...products];

    if (search.trim()) {
      const value = search.toLowerCase().trim();

      result = result.filter((product) => {
        const name =
          product?.name?.toLowerCase() || "";

        const productCategory =
          product?.category?.toLowerCase() || "";

        const description =
          product?.description?.toLowerCase() || "";

        const location =
          product?.location?.toLowerCase() || "";

        const farmerName =
          typeof product?.farmer === "object"
            ? product?.farmer?.name?.toLowerCase() || ""
            : "";

        return (
          name.includes(value) ||
          productCategory.includes(value) ||
          description.includes(value) ||
          location.includes(value) ||
          farmerName.includes(value)
        );
      });
    }

    if (category) {
      result = result.filter(
        (product) =>
          product?.category?.toLowerCase() ===
          category.toLowerCase()
      );
    }

    if (availability === "available") {
      result = result.filter((product) => {
        const quantity = Number(product?.quantity || 0);

        const status = String(
          product?.status || "available"
        ).toLowerCase();

        return (
          status === "available" &&
          quantity > 0
        );
      });
    }

    if (availability === "low-stock") {
      result = result.filter((product) => {
        const quantity = Number(product?.quantity || 0);

        const status = String(
          product?.status || "available"
        ).toLowerCase();

        return (
          status === "available" &&
          quantity > 0 &&
          quantity <= 10
        );
      });
    }

    if (availability === "out-of-stock") {
      result = result.filter((product) => {
        const quantity = Number(product?.quantity || 0);

        const status = String(
          product?.status || ""
        ).toLowerCase();

        return (
          quantity <= 0 ||
          status === "sold" ||
          status === "inactive"
        );
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (
            Number(a?.price || 0) -
            Number(b?.price || 0)
          );

        case "price-high":
          return (
            Number(b?.price || 0) -
            Number(a?.price || 0)
          );

        case "quantity-high":
          return (
            Number(b?.quantity || 0) -
            Number(a?.quantity || 0)
          );

        case "name":
          return String(a?.name || "").localeCompare(
            String(b?.name || "")
          );

        case "newest":
        default: {
          const dateA = new Date(
            a?.createdAt || 0
          ).getTime();

          const dateB = new Date(
            b?.createdAt || 0
          ).getTime();

          return dateB - dateA;
        }
      }
    });

    setFilteredProducts(result);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setAvailability("available");
    setSortBy("newest");
    setShowFilters(false);
  };

  const selectCategory = (value) => {
    setCategory(value);
    setShowFilters(true);

    setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const formatCurrency = (amount) => {
    return `₦${Number(
      amount || 0
    ).toLocaleString("en-NG")}`;
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-success-subtle text-success";

      case "confirmed":
        return "bg-primary-subtle text-primary";

      case "processing":
        return "bg-info-subtle text-info-emphasis";

      case "pending":
        return "bg-warning-subtle text-warning-emphasis";

      case "cancelled":
        return "bg-danger-subtle text-danger";

      default:
        return "bg-secondary-subtle text-secondary";
    }
  };

  const getPaymentClass = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-success-subtle text-success";

      case "pending":
        return "bg-warning-subtle text-warning-emphasis";

      case "failed":
        return "bg-danger-subtle text-danger";

      case "refunded":
        return "bg-info-subtle text-info-emphasis";

      default:
        return "bg-secondary-subtle text-secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return CheckCircle2;

      case "confirmed":
        return PackageCheck;

      case "processing":
        return Clock3;

      case "cancelled":
        return XCircle;

      default:
        return Clock3;
    }
  };

  const getProductName = (order) => {
    if (typeof order?.product === "string") {
      return order.product;
    }

    return (
      order?.product?.name ||
      "Farm Produce"
    );
  };

  const getProductCategory = (order) => {
    if (
      typeof order?.product === "object"
    ) {
      return (
        order?.product?.category ||
        "Farm Produce"
      );
    }

    return "Farm Produce";
  };

  const getFarmerName = (order) => {
    if (typeof order?.farmer === "string") {
      return order.farmer;
    }

    return (
      order?.farmer?.name ||
      order?.farmer?.fullName ||
      "FarmLink Farmer"
    );
  };

  const getProgress = (order) => {
    if (order?.status === "cancelled") {
      return 0;
    }

    if (order?.status === "completed") {
      return 4;
    }

    if (order?.status === "processing") {
      return 3;
    }

    if (order?.status === "confirmed") {
      return 2;
    }

    return 1;
  };

  const renderTracking = (order) => {
    if (order?.status === "cancelled") {
      return (
        <div className="mt-4 p-3 rounded-4 bg-danger-subtle border border-danger-subtle">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center"
              style={{
                width: "40px",
                height: "40px",
                flexShrink: 0,
              }}
            >
              <XCircle size={20} />
            </div>

            <div>
              <div className="fw-bold text-danger">
                Order Cancelled
              </div>

              <small className="text-danger-emphasis">
                This order is no longer being processed.
              </small>
            </div>
          </div>
        </div>
      );
    }

    const progress = getProgress(order);

    const steps = [
      {
        label: "Order Placed",
        icon: ShoppingCart,
      },
      {
        label: "Confirmed",
        icon: CheckCircle2,
      },
      {
        label: "Processing",
        icon: Clock3,
      },
      {
        label: "Completed",
        icon: PackageCheck,
      },
    ];

    return (
      <div className="mt-4 pt-4 border-top">
        <div className="position-relative">
          <div
            className="position-absolute"
            style={{
              top: "18px",
              left: "9%",
              right: "9%",
              height: "3px",
              background: "#e9ecef",
              zIndex: 0,
            }}
          >
            <div
              className="bg-success h-100"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    ((progress - 1) / 3) * 100
                  )
                )}%`,
                transition: "width .4s ease",
              }}
            />
          </div>

          <div className="row position-relative">
            {steps.map((step, index) => {
              const active =
                index + 1 <= progress;

              const Icon = step.icon;

              return (
                <div
                  className="col-3 text-center"
                  key={step.label}
                >
                  <div
                    className={`rounded-circle mx-auto d-flex align-items-center justify-content-center ${
                      active
                        ? "bg-success text-white shadow-sm"
                        : "bg-white border text-muted"
                    }`}
                    style={{
                      width: "38px",
                      height: "38px",
                    }}
                  >
                    <Icon size={17} />
                  </div>

                  <small
                    className={`d-block mt-2 ${
                      active
                        ? "fw-semibold text-success"
                        : "text-muted"
                    }`}
                  >
                    {step.label}
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-3">
          {order.status === "pending" && (
            <small className="text-muted">
              Waiting for the farmer to confirm your order.
            </small>
          )}

          {order.status === "confirmed" && (
            <small className="text-primary">
              Your order has been confirmed by the farmer.
            </small>
          )}

          {order.status === "processing" && (
            <small className="text-info-emphasis">
              Your produce is currently being prepared.
            </small>
          )}

          {order.status === "completed" && (
            <small className="text-success fw-semibold">
              Your order has been successfully completed.
            </small>
          )}
        </div>
      </div>
    );
  };

  const activeFilters =
    Boolean(search) ||
    Boolean(category) ||
    availability !== "available" ||
    sortBy !== "newest";

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const activeOrders = orders.filter((order) =>
    [
      "pending",
      "confirmed",
      "processing",
    ].includes(order.status)
  ).length;

  const availableProducts = products.filter(
    (product) => {
      const quantity = Number(
        product?.quantity || 0
      );

      const status = String(
        product?.status || "available"
      ).toLowerCase();

      return (
        status === "available" &&
        quantity > 0
      );
    }
  ).length;

  return (
    <>
      <main
        className="bg-light min-vh-100"
        style={{
          scrollBehavior: "smooth",
        }}
      >
        <section className="bg-success text-white overflow-hidden">
          <div className="container py-5">
            <div className="row align-items-center py-lg-5">
              <div className="col-lg-7 py-3">
                <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-25 rounded-pill px-3 py-2 mb-4">
                  <Sprout size={16} />

                  <span className="small fw-semibold">
                    FarmLink Marketplace
                  </span>
                </div>

                <h1
                  className="display-4 fw-bold lh-sm mb-4"
                  style={{
                    letterSpacing: "-1px",
                  }}
                >
                  Fresh produce,
                  <br />

                  <span className="text-white-50">
                    directly from farmers.
                  </span>
                </h1>

                <p
                  className="lead text-white-50 mb-4"
                  style={{
                    maxWidth: "650px",
                    lineHeight: "1.7",
                  }}
                >
                  Discover quality farm produce,
                  connect with farmers, and order
                  what you need from one simple
                  marketplace.
                </p>

                <div className="d-flex flex-wrap gap-3">
                  <a
                    href="#products"
                    className="btn btn-light btn-lg px-4 fw-semibold rounded-3 shadow-sm"
                  >
                    Explore Produce

                    <ArrowRight
                      size={18}
                      className="ms-2"
                    />
                  </a>

                  <a
                    href="#orders"
                    className="btn btn-outline-light btn-lg px-4 rounded-3"
                  >
                    <ShoppingCart
                      size={18}
                      className="me-2"
                    />

                    My Orders
                  </a>
                </div>
              </div>

              <div className="col-lg-5 mt-4 mt-lg-0">
                <div
                  className="bg-white bg-opacity-10 rounded-4 p-4 border border-white border-opacity-25 shadow-sm"
                  style={{
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="rounded-3 bg-white bg-opacity-10 d-flex align-items-center justify-content-center"
                      style={{
                        width: "48px",
                        height: "48px",
                      }}
                    >
                      <Sprout size={24} />
                    </div>

                    <div>
                      <div className="fw-semibold">
                        Farm-to-market made simple
                      </div>

                      <small className="text-white-50">
                        Discover. Order. Track.
                      </small>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-4">
                      <div className="bg-white bg-opacity-10 rounded-3 p-3 h-100">
                        <div className="fs-4 fw-bold">
                          {availableProducts}
                        </div>

                        <small className="text-white-50">
                          Available
                        </small>
                      </div>
                    </div>

                    <div className="col-4">
                      <div className="bg-white bg-opacity-10 rounded-3 p-3 h-100">
                        <div className="fs-4 fw-bold">
                          {categories.length}
                        </div>

                        <small className="text-white-50">
                          Categories
                        </small>
                      </div>
                    </div>

                    <div className="col-4">
                      <div className="bg-white bg-opacity-10 rounded-3 p-3 h-100">
                        <div className="fs-4 fw-bold">
                          {activeOrders}
                        </div>

                        <small className="text-white-50">
                          Active Orders
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-top border-white border-opacity-25">
                    <div className="d-flex align-items-center gap-2">
                      <ShieldCheck size={17} />

                      <small className="text-white-50">
                        Simple ordering with secure payment
                        tracking.
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-5">
          <section className="mb-5">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4 d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center"
                      style={{
                        width: "48px",
                        height: "48px",
                        flexShrink: 0,
                      }}
                    >
                      <Package size={22} />
                    </div>

                    <div>
                      <small className="text-muted d-block">
                        Available Produce
                      </small>

                      <div className="fs-4 fw-bold">
                        {availableProducts}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4 d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                      style={{
                        width: "48px",
                        height: "48px",
                        flexShrink: 0,
                      }}
                    >
                      <ShoppingCart size={22} />
                    </div>

                    <div>
                      <small className="text-muted d-block">
                        My Orders
                      </small>

                      <div className="fs-4 fw-bold">
                        {orders.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4 d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 bg-warning-subtle text-warning-emphasis d-flex align-items-center justify-content-center"
                      style={{
                        width: "48px",
                        height: "48px",
                        flexShrink: 0,
                      }}
                    >
                      <TrendingUp size={22} />
                    </div>

                    <div>
                      <small className="text-muted d-block">
                        Completed Orders
                      </small>

                      <div className="fs-4 fw-bold">
                        {completedOrders}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
              <div>
                <span className="small fw-bold text-success">
                  DISCOVER
                </span>

                <h2 className="fw-bold mb-1">
                  Shop by Category
                </h2>

                <p className="text-muted mb-0">
                  Explore fresh products from our farmers.
                </p>
              </div>

              {activeFilters && (
                <button
                  className="btn btn-outline-success rounded-pill px-4"
                  onClick={clearFilters}
                >
                  View Everything
                </button>
              )}
            </div>

            <div className="row g-3">
              {categories.map((item) => {
                const active =
                  category.toLowerCase() ===
                  item.name.toLowerCase();

                const Icon = item.icon;

                return (
                  <div
                    className="col-6 col-md-4 col-lg-2"
                    key={item.name}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        selectCategory(item.name)
                      }
                      className={`card w-100 h-100 text-start overflow-hidden ${
                        active
                          ? "border-success shadow"
                          : "border-0 shadow-sm"
                      }`}
                      style={{
                        cursor: "pointer",
                        transition:
                          "transform .2s ease, box-shadow .2s ease",
                      }}
                    >
                      <div className="position-relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-100"
                          loading="lazy"
                          style={{
                            height: "125px",
                            objectFit: "cover",
                          }}
                        />

                        <span
                          className={`position-absolute bottom-0 start-0 m-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm ${
                            active
                              ? "bg-success text-white"
                              : "bg-white text-success"
                          }`}
                          style={{
                            width: "38px",
                            height: "38px",
                          }}
                        >
                          <Icon size={18} />
                        </span>
                      </div>

                      <div className="card-body p-3">
                        <h6 className="fw-bold mb-1 text-dark">
                          {item.name}
                        </h6>

                        <small className="text-muted">
                          {item.description}
                        </small>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card border-0 shadow-sm rounded-4 mb-5">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <SlidersHorizontal
                      size={18}
                      className="text-success"
                    />

                    <span className="fw-bold">
                      Find what you need
                    </span>
                  </div>

                  <small className="text-muted">
                    Search, filter, and sort available produce.
                  </small>
                </div>

                {activeFilters && (
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-pill"
                    onClick={clearFilters}
                  >
                    <X size={15} className="me-1" />
                    Clear
                  </button>
                )}
              </div>

              <div className="input-group input-group-lg">
                <span className="input-group-text bg-white border-end-0">
                  <Search
                    size={20}
                    className="text-muted"
                  />
                </span>

                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search for rice, tomatoes, fish, poultry..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  className={`btn ${
                    showFilters
                      ? "btn-success"
                      : "btn-outline-success"
                  } rounded-pill px-4`}
                  onClick={() =>
                    setShowFilters((prev) => !prev)
                  }
                >
                  <Filter
                    size={16}
                    className="me-2"
                  />

                  {showFilters
                    ? "Hide Filters"
                    : "Show Filters"}
                </button>
              </div>

              {showFilters && (
                <div className="row g-3 mt-2 pt-3 border-top">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">
                      Category
                    </label>

                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value)
                      }
                    >
                      <option value="">
                        All Categories
                      </option>

                      {categories.map((item) => (
                        <option
                          key={item.name}
                          value={item.name}
                        >
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">
                      Availability
                    </label>

                    <select
                      className="form-select"
                      value={availability}
                      onChange={(e) =>
                        setAvailability(
                          e.target.value
                        )
                      }
                    >
                      <option value="available">
                        Available Now
                      </option>

                      <option value="low-stock">
                        Low Stock
                      </option>

                      <option value="out-of-stock">
                        Out of Stock / Sold
                      </option>

                      <option value="all">
                        All Products
                      </option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">
                      Sort By
                    </label>

                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <ArrowDownUp
                          size={16}
                          className="text-success"
                        />
                      </span>

                      <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value)
                        }
                      >
                        <option value="newest">
                          Newest First
                        </option>

                        <option value="price-low">
                          Price: Low to High
                        </option>

                        <option value="price-high">
                          Price: High to Low
                        </option>

                        <option value="quantity-high">
                          Most Stock
                        </option>

                        <option value="name">
                          Name: A to Z
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeFilters && (
                <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top">
                  <small className="text-muted">
                    Active filters:
                  </small>

                  {category && (
                    <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2">
                      {category}
                    </span>
                  )}

                  {search && (
                    <span className="badge rounded-pill bg-light text-dark border px-3 py-2">
                      "{search}"
                    </span>
                  )}

                  {availability !== "available" && (
                    <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2">
                      {availability === "low-stock"
                        ? "Low Stock"
                        : availability === "out-of-stock"
                          ? "Out of Stock / Sold"
                          : "All Products"}
                    </span>
                  )}

                  {sortBy !== "newest" && (
                    <span className="badge rounded-pill bg-light text-dark border px-3 py-2">
                      {sortBy === "price-low"
                        ? "Price: Low → High"
                        : sortBy === "price-high"
                          ? "Price: High → Low"
                          : sortBy === "quantity-high"
                            ? "Most Stock"
                            : "Name: A → Z"}
                    </span>
                  )}

                  <small className="text-muted ms-auto">
                    {filteredProducts.length} result
                    {filteredProducts.length !== 1
                      ? "s"
                      : ""}
                  </small>
                </div>
              )}
            </div>
          </section>

          <section
            id="products"
            className="mb-5"
          >
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
              <div>
                <span className="small fw-bold text-success">
                  FARM PRODUCE
                </span>

                <h2 className="fw-bold mb-1">
                  {availability === "low-stock"
                    ? "Low Stock Produce"
                    : availability === "out-of-stock"
                      ? "Unavailable Products"
                      : "Available Now"}
                </h2>

                <p className="text-muted mb-0">
                  Quality produce listed by FarmLink
                  farmers.
                </p>
              </div>

              <div className="d-flex align-items-center gap-2">
                <div className="bg-white rounded-pill shadow-sm px-3 py-2">
                  <span className="text-success fw-bold">
                    {filteredProducts.length}
                  </span>{" "}
                  <small className="text-muted">
                    products found
                  </small>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-success rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "42px",
                    height: "42px",
                  }}
                  onClick={fetchProducts}
                  disabled={loading}
                  title="Refresh products"
                >
                  <RefreshCw
                    size={17}
                    className={
                      loading ? "spin" : ""
                    }
                  />
                </button>
              </div>
            </div>

            {loading && (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body text-center py-5">
                  <div
                    className="spinner-border text-success mb-3"
                    role="status"
                  />

                  <p className="text-muted mb-0">
                    Finding fresh produce...
                  </p>
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="alert alert-danger rounded-4 border-0 shadow-sm">
                <div className="fw-bold mb-1">
                  We couldn't load the marketplace.
                </div>

                <div>{error}</div>

                <button
                  className="btn btn-danger mt-3"
                  onClick={fetchProducts}
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              filteredProducts.length === 0 && (
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body text-center py-5">
                    <div className="mb-3 text-success">
                      <Sprout size={48} />
                    </div>

                    <h4 className="fw-bold">
                      No products found
                    </h4>

                    <p
                      className="text-muted mx-auto mb-4"
                      style={{
                        maxWidth: "500px",
                      }}
                    >
                      Try another search term or
                      change your filters to discover
                      more produce.
                    </p>

                    {activeFilters && (
                      <button
                        className="btn btn-success rounded-pill px-4"
                        onClick={clearFilters}
                      >
                        Browse All Produce
                      </button>
                    )}
                  </div>
                </div>
              )}

            {!loading &&
              !error &&
              filteredProducts.length > 0 && (
                <div className="row g-4">
                  {filteredProducts.map((product) => (
                    <div
                      className="col-sm-6 col-lg-4"
                      key={
                        product._id ||
                        product.id
                      }
                    >
                      <ProductCard
                        product={product}
                      />
                    </div>
                  ))}
                </div>
              )}
          </section>

          <section
            id="orders"
            className="pt-4"
          >
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
              <div>
                <span className="small fw-bold text-success">
                  ORDER MANAGEMENT
                </span>

                <h2 className="fw-bold mb-1">
                  My Orders
                </h2>

                <p className="text-muted mb-0">
                  Follow every order from placement
                  to completion.
                </p>
              </div>

              <button
                className="btn btn-outline-success rounded-pill px-4"
                onClick={fetchOrders}
                disabled={
                  ordersLoading ||
                  user?.role !== "buyer"
                }
              >
                <RefreshCw
                  size={17}
                  className={`me-2 ${
                    ordersLoading ? "spin" : ""
                  }`}
                />

                {ordersLoading
                  ? "Refreshing..."
                  : "Refresh Orders"}
              </button>
            </div>

            {user?.role !== "buyer" && (
              <div className="alert alert-light border rounded-4">
                <div className="fw-semibold">
                  Sign in as a buyer to view your orders.
                </div>

                <small className="text-muted">
                  You can still browse all available
                  FarmLink produce without signing in.
                </small>
              </div>
            )}

            {user?.role === "buyer" &&
              !ordersLoading &&
              !ordersError &&
              orders.length > 0 && (
                <div className="alert alert-success border-0 rounded-4 shadow-sm d-flex align-items-center gap-3 mb-4">
                  <div
                    className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                    style={{
                      width: "40px",
                      height: "40px",
                      flexShrink: 0,
                    }}
                  >
                    <PackageCheck size={20} />
                  </div>

                  <div>
                    <div className="fw-bold">
                      Your orders are being tracked
                    </div>

                    <small>
                      {activeOrders > 0
                        ? `${activeOrders} active order${
                            activeOrders !== 1
                              ? "s"
                              : ""
                          } currently in progress.`
                        : "You currently have no active orders."}
                    </small>
                  </div>
                </div>
              )}

            {user?.role === "buyer" &&
              ordersLoading && (
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body text-center py-5">
                    <div
                      className="spinner-border text-success"
                      role="status"
                    />
                  </div>
                </div>
              )}

            {user?.role === "buyer" &&
              !ordersLoading &&
              ordersError && (
                <div className="alert alert-warning rounded-4 border-0">
                  <div className="fw-semibold mb-1">
                    Orders could not be loaded.
                  </div>

                  <div>{ordersError}</div>
                </div>
              )}

            {user?.role === "buyer" &&
              !ordersLoading &&
              !ordersError &&
              orders.length === 0 && (
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body text-center py-5">
                    <div className="mb-3 text-success">
                      <ShoppingCart size={48} />
                    </div>

                    <h4 className="fw-bold">
                      Your order list is empty
                    </h4>

                    <p className="text-muted mb-4">
                      Once you purchase produce,
                      you can track your orders here.
                    </p>

                    <a
                      href="#products"
                      className="btn btn-success rounded-pill px-4"
                    >
                      Start Shopping
                    </a>
                  </div>
                </div>
              )}

            {user?.role === "buyer" &&
              !ordersLoading &&
              !ordersError &&
              orders.length > 0 && (
                <div className="d-flex flex-column gap-4">
                  {orders.map((order) => {
                    const image =
                      getProductImage(
                        order.product
                      );

                    const StatusIcon =
                      getStatusIcon(
                        order.status
                      );

                    return (
                      <div
                        className="card border-0 shadow-sm rounded-4 overflow-hidden"
                        key={
                          order._id ||
                          order.id
                        }
                      >
                        <div className="card-body p-4">
                          <div className="row g-4 align-items-center">
                            <div className="col-lg-5">
                              <div className="d-flex gap-3">
                                <div
                                  className="rounded-4 overflow-hidden bg-light flex-shrink-0 shadow-sm"
                                  style={{
                                    width: "90px",
                                    height: "90px",
                                  }}
                                >
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={getProductName(
                                        order
                                      )}
                                      className="w-100 h-100"
                                      loading="lazy"
                                      style={{
                                        objectFit:
                                          "cover",
                                      }}
                                    />
                                  ) : (
                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-success">
                                      <Sprout
                                        size={30}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <span className="badge rounded-pill bg-success-subtle text-success mb-2">
                                    {getProductCategory(
                                      order
                                    )}
                                  </span>

                                  <h5 className="fw-bold mb-1 text-break">
                                    {getProductName(
                                      order
                                    )}
                                  </h5>

                                  <div className="small text-muted mb-1">
                                    Farmer:{" "}
                                    <strong>
                                      {getFarmerName(
                                        order
                                      )}
                                    </strong>
                                  </div>

                                  {order?.product
                                    ?.location && (
                                    <div className="small text-muted d-flex align-items-center gap-1 mb-1">
                                      <MapPin
                                        size={14}
                                      />

                                      <span>
                                        {
                                          order
                                            .product
                                            .location
                                        }
                                      </span>
                                    </div>
                                  )}

                                  <small className="text-muted">
                                    Ordered{" "}
                                    {formatDate(
                                      order.createdAt
                                    )}
                                  </small>
                                </div>
                              </div>
                            </div>

                            <div className="col-sm-6 col-lg-3">
                              <div className="small text-muted">
                                Quantity
                              </div>

                              <div className="fw-bold mb-3">
                                {order.quantity || 0}
                              </div>

                              <div className="small text-muted">
                                Unit Price
                              </div>

                              <div className="fw-bold">
                                {formatCurrency(
                                  order.unitPrice
                                )}
                              </div>
                            </div>

                            <div className="col-sm-6 col-lg-4">
                              <div className="d-flex flex-wrap gap-2 mb-3">
                                <span
                                  className={`badge rounded-pill px-3 py-2 d-inline-flex align-items-center gap-1 ${getStatusClass(
                                    order.status
                                  )}`}
                                >
                                  <StatusIcon
                                    size={14}
                                  />

                                  {order.status ||
                                    "pending"}
                                </span>

                                <span
                                  className={`badge rounded-pill px-3 py-2 ${getPaymentClass(
                                    order.paymentStatus
                                  )}`}
                                >
                                  Payment:{" "}
                                  {order.paymentStatus ||
                                    "unpaid"}
                                </span>
                              </div>

                              <div className="small text-muted">
                                Order Total
                              </div>

                              <div className="fs-4 fw-bold text-success">
                                {formatCurrency(
                                  order.totalAmount
                                )}
                              </div>
                            </div>
                          </div>

                          {renderTracking(order)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </section>
        </div>
      </main>

      <style>{`
        .min-w-0 {
          min-width: 0;
        }

        .spin {
          animation: farmlink-spin 1s linear infinite;
        }

        @keyframes farmlink-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 575.98px) {
          .display-4 {
            font-size: 2.35rem;
          }

          .input-group-lg .form-control,
          .input-group-lg .input-group-text {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default Marketplace;
