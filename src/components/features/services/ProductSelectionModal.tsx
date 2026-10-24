"use client";

import { addToService } from "@/actions";
import { getProducts, getProductsForCustomer } from "@/actions/productActions";
import { Modal, Spinner, StatusBadge } from "@/components";
import { Product } from "@/types";
import { formatDate, isWarrantyValid } from "@/utils";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type ProductRow = Product & { invoiceNumber?: string; invoiceDate?: Date };

/**
 * Pick a product and add it to the service / install list.
 * Pass `customerId` to list EVERY product the customer owns across all of their
 * invoices (so a merged customer with many products is fully covered); pass
 * `invoiceId` to list only that one invoice's products.
 */
function ProductSelectionModal({
  invoiceId,
  customerId,
  productItems,
  onClose,
}: {
  invoiceId?: string;
  customerId?: string;
  productItems?: Product[];
  onClose: () => void;
}) {
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [serviceType, setServiceType] = useState<"install" | "repair">("repair");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>(productItems ?? []);
  const [isAdding, setIsAdding] = useState(false);

  const showInvoice = !!customerId;

  const addToServiceHandler = async () => {
    if (!selectedProduct) return;
    setIsAdding(true);
    const res = await addToService({ productId: selectedProduct, serviceType });
    toast(res.message, { type: res.success ? "success" : "error" });
    setIsAdding(false);
    if (res.success) onClose();
  };

  const fetchProducts = async () => {
    setIsProductsLoading(true);
    const res = customerId
      ? await getProductsForCustomer(customerId)
      : invoiceId
        ? await getProducts(invoiceId)
        : { success: false as const, message: "No source", data: undefined };
    setIsProductsLoading(false);
    if (res.success && res.data) setProducts(res.data as ProductRow[]);
    else toast.error(("message" in res && res.message) || "Could not load products");
  };

  useEffect(() => {
    // Always load fresh when attached to a customer (covers every invoice);
    // for a single invoice, only load if no items were passed in.
    if (customerId || (productItems?.length ?? 0) === 0) fetchProducts();
    else setIsProductsLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal title="সার্ভিস / ইন্সটলের জন্য পণ্য নির্বাচন করুন" isVisible onClose={onClose} width="700">
      <div className="overflow-x-auto">
        {isProductsLoading ? (
          <div className="py-8 text-center"><Spinner /></div>
        ) : (
          <table className="table-auto w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-100">
                <th></th>
                {showInvoice && <th className="px-3 py-2 whitespace-nowrap">Invoice</th>}
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Serial</th>
                <th className="px-3 py-2 whitespace-nowrap">Warranty</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b cursor-pointer hover:bg-gray-50 ${selectedProduct === product.id ? "bg-blue-50" : ""}`}
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    <td className="py-2 pl-2 text-center">
                      <input
                        type="radio"
                        name="service-product"
                        className="size-5"
                        value={product.id}
                        checked={selectedProduct === product.id}
                        onChange={() => setSelectedProduct(product.id)}
                      />
                    </td>
                    {showInvoice && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="font-semibold">#{product.invoiceNumber}</span>
                        {product.invoiceDate && (
                          <span className="block text-[11px] text-gray-500">{formatDate(product.invoiceDate)}</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2">{product.type.toUpperCase()}</td>
                    <td className="px-3 py-2">{product.model}</td>
                    <td className="px-3 py-2 text-gray-500">{product.serialNumber || "—"}</td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        status={isWarrantyValid(product.warrantyStartDate, product.warrantyDurationMonths) ? "valid" : "expired"}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showInvoice ? 6 : 5} className="text-center py-6 text-gray-500">
                    কোনো পণ্য পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex-1 text-start">
            <label className="text-sm">
              Service Type <span className="text-red-500 text-lg">*</span>
              <select
                className="w-full bg-white border rounded-md outline-none h-10 px-2 mt-1"
                name="serviceType"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as typeof serviceType)}
              >
                <option value="repair">Repair / সার্ভিস</option>
                <option value="install">Install / ইন্সটল</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md">
            Cancel
          </button>
          <button
            type="submit"
            className="__btn"
            onClick={addToServiceHandler}
            disabled={!selectedProduct || isAdding}
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ProductSelectionModal;
