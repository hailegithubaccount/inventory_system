import { useState, useMemo } from "react";
import {
  useProductsQuery,
  useShortagesQuery,
  useTransferMutation,
} from "./hooks/useInventory";

const emptyForm = {
  product_id: "",
  from_warehouse_id: "",
  to_warehouse_id: "",
  quantity: "",
};

function App() {
  const [formData, setFormData] = useState(emptyForm);
  const [localMessage, setLocalMessage] = useState("");
  const [localError, setLocalError] = useState("");

  // React Query Hooks
  const {
    data: products = [],
    isLoading: isLoadingProducts,
    isError: isErrorProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useProductsQuery();

  const {
    data: shortages = [],
    isError: isErrorShortages,
    error: shortagesError,
    refetch: refetchShortages,
  } = useShortagesQuery();

  const transferMutation = useTransferMutation();

  // Optimized Shortage Map using useMemo
  const shortageMap = useMemo(() => {
    return shortages.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
  }, [shortages]);

  const handleRefresh = () => {
    refetchProducts();
    refetchShortages();
    setLocalMessage("");
    setLocalError("");
  };

  const handleSuggestTransfer = (productId) => {
    const shortage = shortageMap[productId];

    if (!shortage || !shortage.suggested_from_warehouse_id) {
      setLocalError("There is no transfer suggestion for this product.");
      return;
    }

    setLocalError("");
    setLocalMessage("");
    setFormData({
      product_id: String(productId),
      from_warehouse_id: String(shortage.suggested_from_warehouse_id),
      to_warehouse_id: String(shortage.suggested_to_warehouse_id),
      quantity: String(shortage.suggested_quantity || ""),
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    setLocalMessage("");

    transferMutation.mutate(
      {
        product_id: Number(formData.product_id),
        from_warehouse_id: Number(formData.from_warehouse_id),
        to_warehouse_id: Number(formData.to_warehouse_id),
        quantity: Number(formData.quantity),
      },
      {
        onSuccess: (data) => {
          setLocalMessage(data.message || "Transfer completed successfully.");
          setFormData(emptyForm);
        },
        onError: (err) => {
          const apiError = err.response?.data?.error || err.message || "Transfer failed.";
          setLocalError(apiError);
        },
      }
    );
  };

  const isLoading = isLoadingProducts || transferMutation.isPending;
  const globalError = isErrorProducts 
    ? (productsError.response?.data?.error || productsError.message)
    : isErrorShortages 
      ? (shortagesError.response?.data?.error || shortagesError.message)
      : localError;

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[28px] bg-ink px-6 py-8 text-paper shadow-card sm:px-8">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-orange-200">
            Stock Control Case Study
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Inventory with stock alerts and transfer suggestions
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            This dashboard shows products, compares stock between two warehouses,
            and helps you transfer stock when one side has a shortage.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white/85 p-4 shadow-card backdrop-blur sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl text-ink">Products</h2>
                <p className="text-sm text-slate-600">
                  Warehouse A and Warehouse B stock in one table
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <p className="rounded-2xl bg-paper p-4 text-sm text-slate-600">
                Loading products...
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4">Product</th>
                      <th className="px-4">Category</th>
                      <th className="px-4">Warehouse A</th>
                      <th className="px-4">Warehouse B</th>
                      <th className="px-4">Reorder Level</th>
                      <th className="px-4">Status</th>
                      <th className="px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const shortage = shortageMap[product.id];
                      const hasSuggestion = Boolean(shortage?.suggested_from_warehouse_id);

                      return (
                        <tr key={product.id} className="rounded-2xl bg-paper text-sm text-ink">
                          <td className="rounded-l-2xl px-4 py-4 font-semibold">
                            {product.name}
                          </td>
                          <td className="px-4 py-4">{product.category || "-"}</td>
                          <td className="px-4 py-4">{product.warehouse_a_qty}</td>
                          <td className="px-4 py-4">{product.warehouse_b_qty}</td>
                          <td className="px-4 py-4">
                            A: {product.warehouse_a_reorder_level} / B:{" "}
                            {product.warehouse_b_reorder_level}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                product.status === "Shortage"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="rounded-r-2xl px-4 py-4">
                            {product.status === "Shortage" ? (
                              <button
                                type="button"
                                onClick={() => handleSuggestTransfer(product.id)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                                  hasSuggestion
                                    ? "bg-moss hover:bg-[#556744]"
                                    : "cursor-not-allowed bg-slate-400"
                                }`}
                                disabled={!hasSuggestion}
                              >
                                Suggest Transfer
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">No action</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-card">
            <h2 className="font-display text-2xl text-ink">Transfer Form</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Click <span className="font-semibold">Suggest Transfer</span> on a shortage row
              to pre-fill this form, then submit the transfer.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">
                  Product ID
                </label>
                <input
                  type="number"
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-accent"
                  placeholder="Enter product id"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">
                  From Warehouse
                </label>
                <select
                  name="from_warehouse_id"
                  value={formData.from_warehouse_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-accent"
                  required
                >
                  <option value="">Choose source warehouse</option>
                  <option value="1">Warehouse A</option>
                  <option value="2">Warehouse B</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">
                  To Warehouse
                </label>
                <select
                  name="to_warehouse_id"
                  value={formData.to_warehouse_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-accent"
                  required
                >
                  <option value="">Choose destination warehouse</option>
                  <option value="1">Warehouse A</option>
                  <option value="2">Warehouse B</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-accent"
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={transferMutation.isPending}
                className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {transferMutation.isPending ? "Submitting..." : "Submit Transfer"}
              </button>
            </form>

            {localMessage ? (
              <div className="mt-4 rounded-2xl bg-green-100 px-4 py-3 text-sm text-green-700">
                {localMessage}
              </div>
            ) : null}

            {globalError ? (
              <div className="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700">
                {globalError}
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl bg-paper p-4 text-sm text-slate-600">
              <p className="font-semibold text-ink">Shortage Notes</p>
              <p className="mt-2">
                If a product is below reorder level in one warehouse, the system checks
                whether the other warehouse has extra stock and suggests the transfer.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
