"use client";

import {
  createCustomer,
  updateCustomer,
  validateReferralVipCard,
  searchCustomersForPurchase,
  addPurchaseToCustomer,
} from "@/actions";
import { getProducts } from "@/actions/productActions";
import { SellerSelect } from "@/components/features/sellers";
import { InputField, Modal, Spinner } from "@/components/ui";
import { paymentTypes, productTypes, warrantyMonths } from "@/constants";
import { CustomerData, Product } from "@/types";
import { computeManualDiscount, parseManualDiscount, stripManualDiscount, type ManualDiscountType } from "@/lib/invoiceDiscount";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

export default function CustomerForm({
  customerData,
  mode,
  onClose,
  role = "admin",
  presetCustomer,
}: {
  /** Opens the create form already attached to this existing customer (add-purchase mode). */
  presetCustomer?: {
    customerId: string;
    name: string;
    phone: string;
    address: string;
    invoiceNumber: string;
    isWarrantyStopped: boolean;
    warrantyStopReason?: string | null;
    invoiceCount: number;
    totalDue: number;
  };
  customerData?: Pick<
    CustomerData,
    "customerId" | "name" | "phone" | "address" | "referredByVipCard"
  > & {
    sellerId?: string | null;
    invoice: Pick<
      CustomerData["invoice"],
      | "id"
      | "date"
      | "paymentType"
      | "subtotal"
      | "total"
      | "dueAmount"
      | "dueType"
      | "notes"
    >;
  };
  mode: "create" | "update";
  onClose: () => void;
  role?: "admin" | "seller";
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [sendInvoiceLink, setSendInvoiceLink] = useState(false);
  const [referralVipCard, setReferralVipCard] = useState("");
  const [sellerId, setSellerId] = useState(customerData?.sellerId || "");
  const [isVipValidating, setIsVipValidating] = useState(false);
  const [vipValidationResult, setVipValidationResult] = useState<{
    success: boolean;
    name?: string;
  } | null>(null);

  // --- Repeat-customer handling (create mode) -------------------------------
  // When adding a record, the admin can search an existing customer by name or
  // phone and attach this purchase as a NEW invoice under that one account
  // instead of creating a duplicate customer.
  type ExistingMatch = {
    customerId: string;
    name: string;
    phone: string;
    address: string;
    invoiceNumber: string;
    isWarrantyStopped: boolean;
    warrantyStopReason?: string | null;
    invoiceCount: number;
    totalDue: number;
  };
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ExistingMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<ExistingMatch | null>(
    presetCustomer ?? null,
  );

  const selectExistingCustomer = (m: ExistingMatch) => {
    setExistingCustomer(m);
    setCustomerInfo((prev) => ({
      ...prev,
      name: m.name,
      phone: m.phone,
      address: m.address,
    }));
    setSearchResults([]);
    setCustomerSearch("");
  };

  const clearExistingCustomer = () => {
    setExistingCustomer(null);
    setCustomerInfo((prev) => ({ ...prev, name: "", phone: "", address: "" }));
  };
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    phone: string;
    address: string;
    invoice: {
      id?: string;
      date: Date;
      paymentType: string;
      subtotal: number;
      total: number;
      dueAmount: number;
      dueType: "due" | "installment";
      notes?: string | null;
    };
  }>(
    (customerData && {
      ...customerData,
      // the manual-discount line is managed by the Discount box, not the notes field
      invoice: { ...customerData.invoice, notes: stripManualDiscount(customerData.invoice?.notes) },
    }) || {
      name: presetCustomer?.name ?? "",
      phone: presetCustomer?.phone ?? "",
      address: presetCustomer?.address ?? "",
      invoice: {
        date: new Date(),
        paymentType: "cash",
        subtotal: 0,
        total: 0,
        dueAmount: 0,
        dueType: "due",
        notes: "",
      },
    },
  );

  const [productItems, setProductItems] = useState<
    Omit<Product, "invoiceId">[]
  >(
    mode === "update"
      ? []
      : [
          {
            id: uuidv4(),
            type: "ips",
            model: "",
            serialNumber: "",
            warrantyDurationMonths: 0,
            warrantyStartDate: new Date(),
            quantity: 1,
            unitPrice: 0,
          },
        ],
  );

  const totalAmount = productItems.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity || 0),
    0,
  );
  const hasReferral =
    (mode === "create" && !!vipValidationResult?.success) ||
    (mode === "update" && !!customerData?.referredByVipCard);

  // Manual admin discount (% or flat), always on the subtotal; stacks after the referral discount.
  const initialDiscount = parseManualDiscount(customerData?.invoice?.notes);
  const [discountType, setDiscountType] = useState<ManualDiscountType>(initialDiscount?.type ?? "percent");
  const [discountValue, setDiscountValue] = useState<string>(initialDiscount ? String(initialDiscount.value) : "");
  const discountNum = Number(discountValue) || 0; // sellers can't edit it, but an existing admin discount still applies
  const discountInvalid =
    discountNum < 0 || (discountType === "percent" ? discountNum > 100 : discountNum > totalAmount);
  const manualDiscountAmount = discountInvalid ? 0 : computeManualDiscount(totalAmount, discountType, discountNum);

  const actualTotal = Math.max(
    0,
    (hasReferral ? Math.floor(totalAmount * 0.96) : totalAmount) - manualDiscountAmount,
  );
  const advanceAmount = actualTotal - customerInfo.invoice.dueAmount;

  const fetchProducts = async () => {
    if (!customerData) return;
    const res = await getProducts(customerData.invoice.id);
    setIsLoadingProducts(false);
    if (res.success) {
      setProductItems(res.data!);
    } else {
      alert(res.message);
    }
  };

  const addItem = () => {
    setProductItems([
      ...productItems,
      {
        id: uuidv4(),
        type: "ips",
        model: "",
        serialNumber: "",
        warrantyDurationMonths: 0,
        warrantyStartDate: new Date(),
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (productItems.length === 1) return;
    setProductItems(productItems.filter((item) => item.id !== id));
  };

  const handleSumbit = async () => {
    toast.dismiss();

    // 1. Basic Validation
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      return toast.error(
        "Please fill in all customer details (Name, Phone, Address)",
      );
    }

    // 2. Product Validation
    const hasInvalidProducts = productItems.some(
      (p) => !p.model || p.quantity <= 0 || p.unitPrice <= 0 || (mode === "create" && !p.serialNumber?.trim()),
    );
    if (hasInvalidProducts) {
      return toast.error(
        "Please provide complete product details (Model, Serial No, Qty, Unit Price > 0)",
      );
    }

    // 3. Referral Validation (if provided)
    if (referralVipCard.length > 0) {
      if (referralVipCard.length < 16) {
        return toast.error("VIP card number must be exactly 16 digits");
      }
      if (!vipValidationResult?.success) {
        return toast.error(
          "Please provide a valid VIP card number or leave it blank",
        );
      }
    }

    // 4. Due amount validation
    if (discountInvalid) {
      return toast.error(
        discountType === "percent"
          ? "Discount percent must be between 0 and 100"
          : "Flat discount cannot exceed the subtotal",
      );
    }
    const maxTotal = actualTotal;
    if (customerInfo.invoice.dueAmount > maxTotal) {
      return toast.error(
        `Due amount cannot exceed the total amount (৳${maxTotal.toLocaleString()})`,
      );
    }

    setIsSubmitting(true);

    const customerDataPayload = {
      ...customerInfo,
      sellerId,
      referralVipCard:
        mode === "create" && vipValidationResult?.success
          ? referralVipCard
          : undefined,
      invoice: {
        ...customerInfo.invoice,
        paymentType:
          (customerInfo.invoice.paymentType as
            | "cash"
            | "bkash"
            | "nagad"
            | "rocket"
            | "bank") ?? "cash",
        subtotal: totalAmount,
        total: totalAmount,
        dueAmount: customerInfo.invoice.dueAmount ?? 0,
        dueType: customerInfo.invoice.dueType ?? "due",
        notes: customerInfo.invoice.notes ?? "",
        manualDiscount: role === "admin" && discountNum > 0 ? { type: discountType, value: discountNum } : null,
      },
      products: productItems,
    };
    const response =
      mode === "create"
        ? existingCustomer
          ? await addPurchaseToCustomer(
              existingCustomer.customerId,
              customerDataPayload,
              sendInvoiceLink,
            )
          : await createCustomer(
              customerDataPayload as Parameters<typeof createCustomer>[0],
              sendInvoiceLink,
            )
        : await updateCustomer(
            customerData!.customerId,
            customerDataPayload as Parameters<typeof updateCustomer>[1],
            sendInvoiceLink,
          );

    if (response.success) onClose();
    setIsSubmitting(false);

    toast(response.message, {
      type: response.success ? "success" : "error",
    });
  };

  const handleCustomerInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const key = e.target.name;
    const value = e.target.value;

    if (key === "name" || key === "phone" || key === "address") {
      setCustomerInfo({
        ...customerInfo,
        [key]: value,
      });
    } else {
      setCustomerInfo({
        ...customerInfo,
        invoice: {
          ...customerInfo.invoice,
          [key]:
            key === "subtotal" || key === "total" || key === "dueAmount"
              ? Number(value)
              : value,
        } as any,
      });
    }
  };

  const handleProductItemChange = (
    id: string,
    field: string,
    value: string | number,
  ) => {
    setProductItems(
      productItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  useEffect(() => {
    if (mode === "update") {
      fetchProducts();
    }
  }, []);

  useEffect(() => {
    if (mode === "create" && referralVipCard.length === 16) {
      const validateCard = async () => {
        setIsVipValidating(true);
        const res = await validateReferralVipCard(referralVipCard);
        setVipValidationResult({ success: res.success, name: res.data?.name });
        setIsVipValidating(false);
      };
      validateCard();
    } else {
      setVipValidationResult(null);
    }
  }, [referralVipCard, mode]);

  // Debounced search for an existing customer (create mode, before one is picked)
  useEffect(() => {
    if (mode !== "create" || existingCustomer) return;
    const q = customerSearch.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let active = true;
    setIsSearching(true);
    const t = setTimeout(async () => {
      const res = await searchCustomersForPurchase(q);
      if (!active) return;
      setSearchResults(res.success && res.data ? (res.data as ExistingMatch[]) : []);
      setIsSearching(false);
    }, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [customerSearch, mode, existingCustomer]);
  return (
    <Modal
      width="900"
      isVisible
      title={
        mode === "update"
          ? "Update Customer"
          : existingCustomer
            ? `নতুন ইনভয়েস — ${existingCustomer.name}`
            : "Create Customer"
      }
      onClose={onClose}
    >
      <div className="space-y-6">
        {mode === "create" && !existingCustomer && (
          <div className="rounded-md border border-[#cfe0fb] bg-[#f5f8fd] p-3">
            <label className="text-sm font-medium text-gray-700">
              আগের কাস্টমার? নাম বা নাম্বার দিয়ে খুঁজুন
            </label>
            <p className="text-xs text-gray-500 mb-1.5">
              মিললে সেটাতে ক্লিক করুন — নতুন মালটা ওই একই অ্যাকাউন্টে আলাদা ইনভয়েস হয়ে যোগ হবে।
            </p>
            <div className="relative">
              <input
                className="__input w-full"
                placeholder="নাম / মোবাইল নম্বর / কাস্টমার আইডি"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {(isSearching || searchResults.length > 0) && (
                <div className="mt-2 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-sm divide-y">
                  {isSearching ? (
                    <div className="p-3 text-sm text-gray-500">
                      <Spinner message="খুঁজছি..." />
                    </div>
                  ) : (
                    searchResults.map((m) => (
                      <button
                        key={m.customerId}
                        type="button"
                        onClick={() => selectExistingCustomer(m)}
                        className="w-full text-left p-2.5 hover:bg-[#f0f6ff] flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold text-gray-900 text-sm truncate">
                            {m.name}{" "}
                            <span className="text-gray-400 font-normal">({m.customerId})</span>
                          </span>
                          <span className="block text-xs text-gray-500 truncate">
                            {m.phone} • {m.address}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[11px] text-gray-500">
                            {m.invoiceCount} invoice
                          </span>
                          {m.totalDue > 0 && (
                            <span className="block text-[11px] font-bold text-red-500">
                              ৳{m.totalDue.toLocaleString()} due
                            </span>
                          )}
                        </span>
                      </button>
                    ))
                  )}
                  {!isSearching && searchResults.length === 0 && customerSearch.trim().length >= 2 && (
                    <div className="p-3 text-sm text-gray-500">কোনো কাস্টমার পাওয়া যায়নি — নিচে নতুন করে যোগ করুন।</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {existingCustomer && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                বিদ্যমান অ্যাকাউন্টে নতুন ইনভয়েস যোগ হচ্ছে
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {existingCustomer.name}{" "}
                <span className="text-gray-400 font-normal">({existingCustomer.customerId})</span>
              </p>
              <p className="text-xs text-gray-600 truncate">
                {existingCustomer.phone} • আগের invoice: {existingCustomer.invoiceCount}
                {existingCustomer.totalDue > 0 && (
                  <span className="text-red-500 font-bold"> • ৳{existingCustomer.totalDue.toLocaleString()} due</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={clearExistingCustomer}
              className="shrink-0 text-xs font-semibold text-gray-600 hover:text-gray-900 underline"
            >
              নতুন কাস্টমার
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <InputField
            onChange={handleCustomerInputChange}
            value={customerInfo.name}
            label="Name"
            name="name"
            readOnly={!!existingCustomer}
          />
          <InputField
            onChange={handleCustomerInputChange}
            value={customerInfo.phone}
            label="Phone Number"
            name="phone"
            type="tel"
            readOnly={!!existingCustomer}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <InputField
            onChange={handleCustomerInputChange}
            value={customerInfo.address}
            label="Address"
            name="address"
            readOnly={!!existingCustomer}
          />
          <InputField
            onChange={handleCustomerInputChange}
            value={
              customerInfo.invoice.date instanceof Date
                ? customerInfo.invoice.date.toISOString().split("T")[0]
                : customerInfo.invoice.date
            }
            label="Date"
            name="date"
            type="date"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {role === "admin" ? (
            <SellerSelect value={sellerId} onChange={setSellerId} />
          ) : (
            <div className="flex-1 text-start">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-gray-700">Purchased from</span>
                <div className="__input flex items-center text-gray-500 bg-gray-100">আপনার দোকান (Seller)</div>
              </label>
            </div>
          )}
          <div className="flex-1 text-start">
            <label className="text-sm">
              Payment Type <span className="text-red-500 text-lg">*</span>
              <select
                className="w-full bg-white border rounded-md outline-none h-10 px-2 mt-1"
                name="paymentType"
                value={customerInfo.invoice.paymentType}
                onChange={handleCustomerInputChange}
              >
                {paymentTypes.map((type) => (
                  <option key={type} value={type.toLowerCase()}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="text-sm">Notes (Shown on Invoice)</label>
            <textarea
              className="w-full bg-white border rounded-md outline-none p-2 mt-1 min-h-[80px]"
              name="notes"
              value={customerInfo.invoice.notes || ""}
              onChange={handleCustomerInputChange as any}
              placeholder="Add any notes here..."
            />
          </div>
        </div>

        {mode === "create" && !existingCustomer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex-1 text-start">
              <InputField
                onChange={(e) =>
                  setReferralVipCard(
                    e.target.value.replace(/\D/g, "").slice(0, 16),
                  )
                }
                value={referralVipCard}
                label="Referral VIP Card Number (Optional)"
                name="referralVipCard"
                placeholder="Enter 16-digit VIP card number"
                required={false}
                maxLength={16}
                className={
                  vipValidationResult?.success === false
                    ? "border-red-500"
                    : vipValidationResult?.success === true
                      ? "border-green-500"
                      : ""
                }
              />
              {isVipValidating && (
                <div className="flex items-center gap-2 mt-1">
                  <Spinner className="size-3" />
                  <span className="text-xs text-gray-500">Validating...</span>
                </div>
              )}
              {referralVipCard.length > 0 && referralVipCard.length < 16 && (
                <p className="text-xs text-amber-600 mt-1">
                  VIP card number must be 16 digits ({referralVipCard.length}
                  /16)
                </p>
              )}
              {vipValidationResult?.success === true && (
                <div className="mt-1">
                  <p className="text-xs text-green-600 font-medium">
                    ✓ Valid VIP Card (Referrer: {vipValidationResult.name})
                  </p>
                  <p className="text-xs text-green-600">
                    5% discount will be applied to the total
                  </p>
                </div>
              )}
              {vipValidationResult?.success === false && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  ✗ Invalid or inactive VIP card number
                </p>
              )}
            </div>
          </div>
        )}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <input
              onChange={(e) => setSendInvoiceLink(e.target.checked)}
              checked={sendInvoiceLink}
              className="size-5"
              id="sendInvoiceLink"
              type="checkbox"
              name="sendDownloadLink"
            />
            <label htmlFor="sendInvoiceLink">Send Invoice link</label>
          </div>
        </div>
        {/* Invoice Items Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Products</h3>
            <button
              type="button"
              onClick={addItem}
              className="px-2 py-1 text-sm __btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Item
            </button>
          </div>
          <div className="">
            <div className="overflow-x-auto">
              <table className="w-full table-auto whitespace-nowrap">
                <thead>
                  <tr className="text-sm bg-gray-100">
                    <th className="text-left py-3 px-2">
                      Type <span className="text-red-500">*</span>
                    </th>
                    <th className="text-left py-3 px-2">
                      Model <span className="text-red-500">*</span>
                    </th>
                    <th className="text-left py-3 px-2">
                      Serial No {mode === "create" && <span className="text-red-500">*</span>}
                    </th>
                    <th className="text-left py-3 px-2">Warranty</th>
                    <th className="text-left py-3 px-2">Warranty Start Date</th>
                    <th className="text-left py-3 px-2">
                      Qty <span className="text-red-500">*</span>
                    </th>
                    <th className="text-left py-3 px-2">
                      Unit Price <span className="text-red-500">*</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mode === "update" && isLoadingProducts ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-3 text-gray-600"
                      >
                        <Spinner />
                      </td>
                    </tr>
                  ) : (
                    productItems.map((item) => (
                      <tr key={item.id}>
                        <td className="pr-2">
                          <select
                            className="bg-white border rounded-md outline-none h-10 px-2 mt-1"
                            value={item.type}
                            onChange={(e) =>
                              handleProductItemChange(
                                item.id,
                                "type",
                                e.target.value.toLowerCase(),
                              )
                            }
                          >
                            {productTypes.map((productType) => (
                              <option key={productType} value={productType}>
                                {productType.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 min-w-[240px]">
                          <InputField
                            name={`model-${item.id}`}
                            placeholder="Model"
                            required={true}
                            variant="sm"
                            value={item.model}
                            onChange={(e) =>
                              handleProductItemChange(
                                item.id,
                                "model",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="p-2 min-w-[200px]">
                          <InputField
                            name={`serial-${item.id}`}
                            placeholder="Serial No"
                            required={mode === "create"}
                            variant="sm"
                            value={item.serialNumber ?? ""}
                            onChange={(e) =>
                              handleProductItemChange(
                                item.id,
                                "serialNumber",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <select
                            className="bg-white border rounded-md outline-none h-10 px-2 mt-1"
                            value={item.warrantyDurationMonths}
                            onChange={(e) =>
                              handleProductItemChange(
                                item.id,
                                "warrantyDurationMonths",
                                e.target.value,
                              )
                            }
                          >
                            {warrantyMonths.map((m) =>
                              m === 0 ? (
                                <option key={m} value={m}>
                                  NONE
                                </option>
                              ) : (
                                <option key={m} value={m}>
                                  {m} {m === 1 ? "Month" : "Months"}
                                </option>
                              ),
                            )}
                          </select>
                        </td>
                        <td className="p-2">
                          <InputField
                            name={`warrantyStartDate-${item.id}`}
                            type="date"
                            required={false}
                            variant="sm"
                            value={
                              item.warrantyStartDate instanceof Date
                                ? item.warrantyStartDate
                                    .toISOString()
                                    .split("T")[0]
                                : item.warrantyStartDate
                            }
                            onChange={(e) =>
                              handleProductItemChange(
                                item.id,
                                "warrantyStartDate",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="p-2 w-24">
                          <InputField
                            name={`totalPrice-${item.id}`}
                            min={1}
                            type="number"
                            placeholder="Quantity"
                            required={true}
                            variant="sm"
                            value={item.quantity}
                            onChange={(e) =>
                              handleProductItemChange(
                                item.id,
                                "quantity",
                                parseInt(e.target.value),
                              )
                            }
                          />
                        </td>
                        <td className="p-2 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <InputField
                              name={`totalPrice-${item.id}`}
                              min={0}
                              type="number"
                              placeholder="Unit Price"
                              required={true}
                              variant="sm"
                              className="min-w-[90px]"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleProductItemChange(
                                  item.id,
                                  "unitPrice",
                                  parseInt(e.target.value),
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={productItems.length === 1}
                              title={
                                productItems.length === 1
                                  ? "Cannot remove last item"
                                  : "Remove item"
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="size-6"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <hr className="my-4" />
            <div className="flex flex-col gap-1 mt-6 w-[47%] ml-auto">
              <div className="flex justify-between">
                <p className=" font-medium">Sub Total:</p>
                <p className=" font-medium">
                  {totalAmount.toLocaleString()} TK
                </p>
              </div>
              {hasReferral && totalAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <p className="font-medium">Referral Discount (4%):</p>
                  <p className="font-medium">
                    -{Math.floor(totalAmount * 0.04).toLocaleString()} TK
                  </p>
                </div>
              )}
              {role === "admin" && (
              <div className="rounded-md border border-[#cfe0fb] bg-[#f5f8fd] p-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">Discount:</p>
                  <div className="flex gap-2 w-64">
                    <select
                      className="w-[42%] bg-white border rounded-md outline-none px-2 h-9"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as ManualDiscountType)}
                      aria-label="Discount type"
                    >
                      <option value="percent">%</option>
                      <option value="flat">৳ Flat</option>
                    </select>
                    <input
                      className="__input w-[58%] h-9"
                      type="number"
                      min={0}
                      max={discountType === "percent" ? 100 : totalAmount}
                      step="any"
                      placeholder={discountType === "percent" ? "0 %" : "0 ৳"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      aria-label="Discount value"
                    />
                  </div>
                </div>
                {discountInvalid ? (
                  <p className="text-xs text-red-600 text-right">
                    {discountType === "percent" ? "0–100% only" : `Max ৳${totalAmount.toLocaleString()}`}
                  </p>
                ) : manualDiscountAmount > 0 ? (
                  <div className="flex justify-between text-red-600">
                    <p className="font-medium">Discount{discountType === "percent" ? ` (${discountNum}%)` : ""}:</p>
                    <p className="font-medium">-{manualDiscountAmount.toLocaleString()} TK</p>
                  </div>
                ) : null}
              </div>
              )}
              <div className="flex justify-between">
                <p className=" font-medium">Total:</p>
                <p className=" font-medium">
                  {actualTotal.toLocaleString()} TK
                </p>
              </div>
              <div className="flex justify-between">
                <p className=" font-medium">Advance:</p>
                <p className=" font-medium">
                  {advanceAmount > 0 ? advanceAmount.toLocaleString() : 0} TK
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className=" font-medium">Due/Installment:</p>
                <div className="flex gap-2 w-64">
                  <select
                    className="w-1/2 bg-white border rounded-md outline-none px-2"
                    name="dueType"
                    value={customerInfo.invoice.dueType}
                    onChange={handleCustomerInputChange as any}
                  >
                    <option value="due">Due</option>
                    <option value="installment">Installment</option>
                  </select>
                  <input
                    className="__input w-1/2"
                    name="dueAmount"
                    min={0}
                    max={actualTotal}
                    type="number"
                    placeholder="Amount"
                    required={false}
                    value={customerInfo.invoice.dueAmount}
                    onChange={handleCustomerInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="__btn"
            onClick={handleSumbit}
            disabled={
              isSubmitting ||
              discountInvalid ||
              customerInfo.invoice.dueAmount > actualTotal ||
              !customerInfo.name ||
              !customerInfo.phone ||
              !customerInfo.address ||
              productItems.some(
                (p) => !p.model || p.quantity <= 0 || p.unitPrice <= 0 || (mode === "create" && !p.serialNumber?.trim()),
              ) ||
              (referralVipCard.length > 0 &&
                (referralVipCard.length < 16 ||
                  vipValidationResult?.success === false))
            }
          >
            {mode === "update"
              ? isSubmitting
                ? "Updating..."
                : "Update"
              : existingCustomer
                ? isSubmitting
                  ? "যোগ হচ্ছে..."
                  : "ইনভয়েস যোগ করুন"
                : isSubmitting
                  ? "Adding..."
                  : "Add Record"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
