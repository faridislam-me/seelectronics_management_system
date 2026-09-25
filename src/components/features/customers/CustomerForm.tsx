"use client";

import {
  createCustomer,
  updateCustomer,
  validateReferralVipCard,
} from "@/actions";
import { getProducts } from "@/actions/productActions";
import { SellerSelect } from "@/components/features/sellers";
import { InputField, Modal, Spinner } from "@/components/ui";
import { paymentTypes, productTypes, warrantyMonths } from "@/constants";
import { CustomerData, Product } from "@/types";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

export default function CustomerForm({
  customerData,
  mode,
  onClose,
  role = "admin",
}: {
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
    customerData || {
      name: "",
      phone: "",
      address: "",
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

  const actualTotal = hasReferral
    ? Math.floor(totalAmount * 0.96)
    : totalAmount;
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
      (p) => !p.model || p.quantity <= 0 || p.unitPrice <= 0,
    );
    if (hasInvalidProducts) {
      return toast.error(
        "Please provide complete product details (Model, Qty, Unit Price > 0)",
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
    const maxTotal = hasReferral ? totalAmount * 0.96 : totalAmount;
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
      },
      products: productItems,
    };
    const response =
      mode === "create"
        ? await createCustomer(
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
  return (
    <Modal
      width="900"
      isVisible
      title={mode === "update" ? "Update Customer" : "Create Customer"}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <InputField
            onChange={handleCustomerInputChange}
            value={customerInfo.name}
            label="Name"
            name="name"
          />
          <InputField
            onChange={handleCustomerInputChange}
            value={customerInfo.phone}
            label="Phone Number"
            name="phone"
            type="tel"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <InputField
            onChange={handleCustomerInputChange}
            value={customerInfo.address}
            label="Address"
            name="address"
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

        {mode === "create" && (
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
                        colSpan={6}
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
                        <td className="p-2">
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
                                  {m} Months
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
                        <td className="p-2">
                          <div className="flex gap-3">
                            <InputField
                              name={`totalPrice-${item.id}`}
                              min={0}
                              type="number"
                              placeholder="Unit Price"
                              required={true}
                              variant="sm"
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
              customerInfo.invoice.dueAmount > actualTotal ||
              !customerInfo.name ||
              !customerInfo.phone ||
              !customerInfo.address ||
              productItems.some(
                (p) => !p.model || p.quantity <= 0 || p.unitPrice <= 0,
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
              : isSubmitting
                ? "Adding..."
                : "Add Record"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
