"use client";

import {
  getCustomerById,
  getFeedbackHistoryById,
  getServiceHistoryById,
} from "@/actions";
import { Modal, ProfileLinkButton, Spinner, StatusBadge } from "@/components";
import { CustomerData, Product } from "@/types";
import { formatDate, isWarrantyValid } from "@/utils";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function CustomerViewModal({
  customerId,
  customer,
  products,
  onClose,
}: {
  customerId?: string;
  customer?: CustomerData;
  products?: Product[];
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(customerId ? true : false);
  const [customerData, setCustomerData] = useState<any>({ ...customer });
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productItems, setProductItems] = useState(products || []);
  // Every invoice (purchase) under this customer account, newest first.
  const [invoicesData, setInvoicesData] = useState<any[]>((customer as any)?.invoices ?? []);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [feedbacksData, setFeedbacksData] = useState<any[]>([]);
  const [isLoadingServiceHistory, setIsLoadingServiceHistory] = useState(false);
  const [isLoadingFeedbacksHistory, setIsLoadingFeedbacksHistory] =
    useState(false);

  useEffect(() => {
    if (products) {
      setProductItems(products);
      setIsProductsLoading(false);
    }
  }, [products]);

  const serviceHistoryToggleHandler = async (
    e: React.ToggleEvent<HTMLDetailsElement>,
  ) => {
    const element = e.currentTarget;
    if (element.open && serviceData.length === 0) {
      setIsLoadingServiceHistory(true);
      const res = await getServiceHistoryById(customerData.customerId);
      if (res.success) {
        setServiceData(res.data ? [...res.data] : []);
      } else {
        toast.error(res.message);
      }
      setIsLoadingServiceHistory(false);
    }
  };

  const feedbackHistoryToggleHandler = async (
    e: React.ToggleEvent<HTMLDetailsElement>,
  ) => {
    const element = e.currentTarget;
    if (element.open && feedbacksData.length === 0) {
      setIsLoadingFeedbacksHistory(true);
      const res = await getFeedbackHistoryById(customerData.customerId);
      if (res.success) {
        setFeedbacksData(res.data ? [...res.data] : []);
      } else {
        toast.error(res.message);
      }
      setIsLoadingFeedbacksHistory(false);
    }
  };

  useEffect(() => {
    const id = customerId ?? customer?.customerId;
    if (!id) {
      setIsProductsLoading(false);
      return;
    }
    (async () => {
      if (customerId) setIsLoading(true);
      // Always load the full record so every purchase (invoice) is shown.
      const res = await getCustomerById(id);
      if (res.success && res.data) {
        setCustomerData({ ...res.data });
        const invs = (res.data as any).invoices ?? [];
        setInvoicesData(invs);
        setProductItems(invs.flatMap((inv: any) => inv.products ?? []));
      } else {
        toast.error(res.message);
        if (customerId) onClose();
      }
      setIsLoading(false);
      setIsProductsLoading(false);
    })();
  }, []);
  return (
    <Modal title="Customer Profile" isVisible onClose={onClose}>
      {isLoading ? (
        <div className="__center h-32">
          <Spinner />
        </div>
      ) : (
        <div>
          <div className="font-semibold mb-2 p-1 bg-blue-100">
            Customer Info
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 text-md border-b pb-4">
            <div>
              <div className="flex border-b py-1">
                <span className="w-32 flex-shrink-0">Customer ID</span>
                <span className="mr-4 flex-shrink-0">:</span>
                <span className="font-semibold">{customerData.customerId}</span>
              </div>
              <div className="flex border-b py-1">
                <span className="w-32 flex-shrink-0">Invoice number</span>
                <span className="mr-4 flex-shrink-0">:</span>
                <span className="font-semibold">
                  {customerData.invoiceNumber}
                </span>
              </div>
              <div className="flex border-b py-1">
                <span className="w-32 flex-shrink-0">Name</span>
                <span className="mr-4 flex-shrink-0">:</span>
                <span className="font-semibold">{customerData.name}</span>
              </div>
              {customerData.isWarrantyStopped && (
                <div className="flex border-b py-1">
                  <span className="w-32 flex-shrink-0">Block</span>
                  <span className="mr-4 flex-shrink-0">:</span>
                  {customerData.warrantyStopReason === "misuse" ? (
                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-[12px] font-bold">অপব্যবহার/নষ্ট প্রমাণিত — ওয়ারেন্টি বাতিল</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[12px] font-bold">বকেয়া টাকা পরিশোধ না করা</span>
                  )}
                </div>
              )}
              <div className="flex border-b py-1">
                <span className="w-32 flex-shrink-0">Phone</span>
                <span className="mr-4 flex-shrink-0">:</span>
                <span className="font-semibold">{customerData.phone}</span>
              </div>
              <div className="flex border-b py-1">
                <span className="w-32 flex-shrink-0">Address</span>
                <span className="mr-4 flex-shrink-0">:</span>
                <span className="font-semibold">{customerData.address}</span>
              </div>
              {productItems.some((p: any) => p.serialNumber) && (
                <div className="flex border-b py-1">
                  <span className="w-32 flex-shrink-0">Serial No</span>
                  <span className="mr-4 flex-shrink-0">:</span>
                  <span className="font-semibold flex flex-col">
                    {productItems.filter((p: any) => p.serialNumber).map((p: any, i: number) => (
                      <span key={i} className="break-all">
                        {productItems.length > 1 ? `${p.model}: ` : ""}{p.serialNumber}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              {customerData.vipCardNumber && (
                <div className="flex border-b py-1">
                  <span className="w-32 flex-shrink-0">VIP Card</span>
                  <span className="mr-4 flex-shrink-0">:</span>
                  <span className="font-semibold">
                    {customerData.vipCardNumber}
                  </span>
                </div>
              )}
              {customerData.referredByVipCard && (
                <div className="flex border-b py-1 text-indigo-700">
                  <span className="w-32 flex-shrink-0">Referral Card</span>
                  <span className="mr-4 flex-shrink-0">:</span>
                  <span className="font-semibold">
                    {customerData.referredByVipCard}
                    {customerData.referredByRecord?.referrer && (
                      <span className="ml-2 text-gray-500 font-normal">
                        ({customerData.referredByRecord.referrer.name})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
            {invoicesData.length > 0 ? (
              (() => {
                const totalSub = invoicesData.reduce((t, i) => t + (i.subtotal || 0), 0);
                const totalBill = invoicesData.reduce((t, i) => t + (i.total || 0), 0);
                const totalDue = invoicesData.reduce((t, i) => t + (i.dueAmount || 0), 0);
                const discount = Math.max(0, totalSub - totalBill);
                return (
                  <div>
                    <div className="flex border-b py-1">
                      <span className="w-32 flex-shrink-0">Purchases</span>
                      <span className="mr-4 flex-shrink-0">:</span>
                      <span className="font-semibold">{invoicesData.length} invoice</span>
                    </div>
                    <div className="flex border-b py-1">
                      <span className="w-32 flex-shrink-0">Product Price</span>
                      <span className="mr-4 flex-shrink-0">:</span>
                      <span className="font-semibold">{totalSub.toLocaleString()} TK</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex border-b py-1">
                        <span className="w-32 flex-shrink-0 text-gray-500">Discount</span>
                        <span className="mr-4 flex-shrink-0">:</span>
                        <span className="font-semibold text-green-600">{discount.toLocaleString()} TK</span>
                      </div>
                    )}
                    <div className="flex border-b py-1">
                      <span className="w-32 flex-shrink-0">Total Bill</span>
                      <span className="mr-4 flex-shrink-0">:</span>
                      <span className="font-bold">{totalBill.toLocaleString()} TK</span>
                    </div>
                    <div className="flex border-b py-1">
                      <span className="w-32 flex-shrink-0 text-gray-500">Paid Amount</span>
                      <span className="mr-4 flex-shrink-0">:</span>
                      <span className="font-semibold text-emerald-600">{(totalBill - totalDue).toLocaleString()} TK</span>
                    </div>
                    {totalDue > 0 && (
                      <div className="flex border-b py-1">
                        <span className="w-32 flex-shrink-0 text-red-500">Due Amount</span>
                        <span className="mr-4 flex-shrink-0 text-red-500">:</span>
                        <span className="font-bold text-red-500">{totalDue.toLocaleString()} TK</span>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="__center h-full text-gray-400 italic">
                No invoice associated with this customer
              </div>
            )}
          </div>
          <h2 className="text-lg font-semibold mt-4 mb-2">
            Purchases{invoicesData.length > 0 ? ` (${invoicesData.length})` : ""}
          </h2>
          {isProductsLoading ? (
            <div className="__center text-gray-500 h-24">
              <Spinner />
            </div>
          ) : invoicesData.length === 0 ? (
            <div className="__center text-gray-400 italic h-16">No purchases found</div>
          ) : (
            <div className="flex flex-col gap-4">
              {invoicesData.map((inv: any) => (
                <div key={inv.id} className="rounded-md border border-gray-200 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-3 py-2 border-b">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-gray-900">#{inv.invoiceNumber}</span>
                      <span className="text-gray-500">{formatDate(inv.date)}</span>
                      <span className="uppercase text-xs font-semibold text-gray-500">{inv.paymentType}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold">৳{(inv.total || 0).toLocaleString()}</span>
                      {inv.dueAmount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-xs font-bold">
                          ৳{inv.dueAmount.toLocaleString()} due
                        </span>
                      )}
                      <a
                        target="_blank"
                        href={`/pdf/download?type=invoice&id=${inv.invoiceNumber}`}
                        className="text-brand font-semibold text-xs hover:underline whitespace-nowrap"
                      >
                        PDF ডাউনলোড
                      </a>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm">
                      <thead>
                        <tr className="text-left bg-white border-b">
                          <th className="px-3 py-1.5">Type</th>
                          <th className="px-3 py-1.5">Model</th>
                          <th className="px-3 py-1.5">Warranty</th>
                          <th className="px-3 py-1.5">Start date</th>
                          <th className="px-3 py-1.5">Status</th>
                          <th className="px-3 py-1.5">Qty</th>
                          <th className="px-3 py-1.5">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(inv.products ?? []).length > 0 ? (
                          inv.products.map((product: any, index: number) => (
                            <tr key={index} className="border-b last:border-0">
                              <td className="px-3 py-1.5">{product.type.toUpperCase()}</td>
                              <td className="px-3 py-1.5">
                                {product.model}
                                {product.serialNumber ? (
                                  <span className="block text-xs text-gray-400">S/N: {product.serialNumber}</span>
                                ) : null}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {product.warrantyDurationMonths === 0 ? "None" : product.warrantyDurationMonths + " Months"}
                              </td>
                              <td className="px-3 py-1.5">{formatDate(product.warrantyStartDate)}</td>
                              <td className="px-3 py-1.5 text-center">
                                <StatusBadge
                                  status={
                                    isWarrantyValid(product.warrantyStartDate, product.warrantyDurationMonths)
                                      ? "valid"
                                      : "expired"
                                  }
                                />
                              </td>
                              <td className="px-3 py-1.5 text-center">{product.quantity}</td>
                              <td className="px-3 py-1.5">{product.unitPrice.toLocaleString()} TK</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-2 text-gray-400 italic">
                              No products
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-col gap-4">
            <details onToggle={serviceHistoryToggleHandler}>
              <summary className="font-semibold select-none cursor-pointer">
                Servicing History
              </summary>
              {isLoadingServiceHistory ? (
                <div className="__center text-gray-400 h-32">
                  <Spinner />
                </div>
              ) : serviceData.length === 0 ? (
                <div className="__center text-gray-400 h-32">No history</div>
              ) : (
                <ul className="mt-4 overflow-auto max-h-80">
                  {serviceData.map((service: any, i: number) => (
                    <li key={service.id} className="relative flex gap-3.5">
                      <span className="text-sm">
                        {formatDate(service.createdAt)}
                      </span>
                      <div className="flex gap-3.5">
                        <div className="w-3.5 flex flex-col h-full pt-1">
                          <div
                            className={clsx(
                              "size-3.5 rounded-full  __center text-white relative bg-blue-500",
                            )}
                          ></div>
                          {i != serviceData!.length - 1 && (
                            <div
                              className={"bg-gray-300 w-0.5 m-auto flex-1"}
                            ></div>
                          )}
                        </div>
                        <div className="flex flex-col text-start gap-2 pb-8">
                          <div className={clsx("font-bold space-x-2")}>
                            <span>
                              {service.productType.toUpperCase()}-
                              {service.productModel}
                            </span>
                            <StatusBadge
                              status={
                                service.statusHistory[0].status ?? "custom"
                              }
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              Service Id:{" "}
                              <span className="font-semibold text-sm">
                                {service.serviceId}
                              </span>
                            </span>
                            <span className="text-sm">
                              Servceman:{" "}
                              {service.staffName ? (
                                service.staffId ? (
                                  <ProfileLinkButton
                                    text={service.staffName}
                                    staffId={service.staffId}
                                  />
                                ) : (
                                  <span className="font-semibold text-sm hover:unserline">
                                    {service.staffName}
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-400 text-sm ">
                                  Not assigned
                                </span>
                              )}
                            </span>
                            <span className="text-sm">
                              Address:{" "}
                              <span className="font-semibold text-sm">
                                {service.customerAddress}
                              </span>
                            </span>
                            <span className="text-sm">
                              Service Type:{" "}
                              <span className="font-semibold text-sm">
                                {service.type === "install"
                                  ? "Installation"
                                  : "Repair"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </details>
            <details onToggle={feedbackHistoryToggleHandler}>
              <summary className="font-semibold select-none cursor-pointer">
                Feedback History
              </summary>
              {isLoadingFeedbacksHistory ? (
                <div className="__center text-gray-400 h-32">
                  <Spinner />
                </div>
              ) : feedbacksData.length === 0 ? (
                <div className="__center text-gray-400 h-32">No history</div>
              ) : (
                <ul className="mt-4 overflow-auto max-h-80">
                  {feedbacksData.map((feedback: any, i: number) => (
                    <li key={feedback.id} className="relative flex gap-3.5">
                      <span className="text-sm leading-none">
                        {formatDate(feedback.createdAt)}
                      </span>
                      <div className="flex gap-3.5">
                        <div className="w-3.5 flex flex-col h-full">
                          <div
                            className={clsx(
                              "size-3.5 rounded-full  __center text-white relative bg-blue-500",
                            )}
                          ></div>
                          {i != feedbacksData.length - 1 && (
                            <div
                              className={"bg-gray-300 w-0.5 m-auto flex-1"}
                            ></div>
                          )}
                        </div>
                        <div className="flex flex-col text-start gap-2 pb-8">
                          <div className={clsx("font-bold leading-none")}>
                            {feedback.service.productType.toUpperCase()}-
                            {feedback.service.productModel}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              Service Id:{" "}
                              <span className="font-semibold text-sm">
                                {feedback.service.serviceId}
                              </span>
                            </span>
                            <span className="text-sm">
                              Serviceman:{" "}
                              {feedback.service.staffName ? (
                                feedback.service.staffId ? (
                                  <ProfileLinkButton
                                    text={feedback.service.staffName}
                                    staffId={feedback.service.staffId}
                                  />
                                ) : (
                                  <span className="font-semibold text-sm hover:unserline">
                                    {feedback.service.staffName}
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-400 text-sm ">
                                  Not assigned
                                </span>
                              )}
                            </span>
                            <details className="max-h-[50vh] overflow-auto text-sm">
                              <summary className="text-sm font-semibold mb-2 cursor-pointer">
                                Feedbacks
                              </summary>
                              {feedback.feedbacks?.map((f: any) => (
                                <div key={f.question}>
                                  <div className="mb-1">
                                    <span className="font-medium">
                                      প্রশ্ন:{" "}
                                    </span>
                                    <span className="font-semibold text-gray-500">
                                      {f.question}
                                    </span>
                                  </div>
                                  <div className="mb-1">
                                    <span className="font-medium">উত্তর: </span>
                                    <span className="font-semibold text-gray-500">
                                      {f.answer}
                                    </span>
                                  </div>
                                  {f.amount && (
                                    <div className="mb-1">
                                      <span className="font-medium">
                                        টাকার পরিমান:{" "}
                                      </span>
                                      <span className="font-semibold text-gray-500">
                                        {f.amount}
                                      </span>
                                    </div>
                                  )}
                                  {f.comment && (
                                    <div className="mb-1">
                                      <span className="font-medium">
                                        মন্তব্য:{" "}
                                      </span>
                                      <span className="font-semibold text-gray-500">
                                        {f.comment}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </details>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default CustomerViewModal;
