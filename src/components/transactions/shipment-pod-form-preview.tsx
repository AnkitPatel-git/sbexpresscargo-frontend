"use client";

import Image from "next/image";
import type { Shipment } from "@/types/transactions/shipment";
import { formatDateOnlyDdMmYyyy } from "@/lib/format-date-only";
import { formatShipmentPaymentTypeLabel } from "@/lib/shipment-payment-label";
import { cn } from "@/lib/utils";

const OFFICE_LINES = [
    "A4, Mitul Industrial Estate, Sativali Road,",
    "Next to Nikolus Sai Service, Agarwal Naka,",
    "Vasai East - 401208",
] as const;

const SHIPPER_AGREEMENT =
    "I/We hereby agree to the terms & conditions printed overleaf. I/We declare that this consignment does not contain any item which is prohibited or restricted or liable to Octroi or any item which is contraband of explosive nature.";

const PAYMENT_NOTE =
    "YOU CAN PAY THROUGH SCANNER OR UPI ID\nALL CHEQUES SHOULD BE DRAWN IN FAVOUR OF SB Express Cargo";

const TERMS = [
    "SB Express Cargo will not be responsible for any loss/damage of goods in transit due to any accident, theft, robbery, fire or for any unforeseen reasons beyond our control.",
    "Jewellery, Cash, Currency, Explosives, Gas Cylinders, Precious Stones, Liquor, Arms & Ammunition, Livestock, contraband items are strictly prohibited.",
    "This Airway Bill is non-negotiable and has been issued & accepted subject to the terms & conditions printed overleaf.",
];

function fb(v?: string | number | null): string {
    if (v === null || v === undefined || v === "") return "";
    return String(v);
}

/** Compact multi-ref display: "CI1 / CI2, CI3" → "CI1,CI2,CI3" */
function formatDrsReferenceNo(raw?: string | null): string {
    if (!raw?.trim()) return "";
    const parts = String(raw)
        .split(/[,/;|\s]+/)
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.join(",");
}

function stateFrom(
    entity: Shipment["shipper"] | Shipment["consignee"],
): string {
    if (!entity) return "—";
    const s =
        entity.stateMaster?.stateName?.trim() ||
        entity.serviceablePincode?.state?.stateName?.trim();
    return s || "—";
}

function countryFrom(entity: Shipment["shipper"] | Shipment["consignee"]): string {
    return entity?.country?.name?.trim() || "INDIA";
}

export function ShipmentPodFormPreview({ shipment }: { shipment: Shipment }) {
    const shipper = shipment.shipper;
    const consignee = shipment.consignee;

    const originCity =
        shipper?.serviceablePincode?.cityName?.trim().toUpperCase() ||
        (shipment.origin?.split(",").pop()?.trim().toUpperCase() ?? "—");
    const destCity =
        consignee?.serviceablePincode?.cityName?.trim().toUpperCase() ||
        (shipment.destination?.split(",").pop()?.trim().toUpperCase() ?? "—");

    const piecesTotal =
        shipment.pieces ??
        ((shipment.piecesRows || []).reduce((s, r) => s + (Number(r.pieces) || 0), 0) ||
            1);

    const first = (shipment.piecesRows || [])[0];
    const l = first?.length != null ? Number(first.length) : 0;
    const b = first?.breadth != null ? Number(first.breadth) : 0;
    const h = first?.height != null ? Number(first.height) : 0;
    const volSum = (shipment.piecesRows || []).reduce(
        (s, r) => s + (Number(r.volumetricWeight) || 0),
        0,
    );
    const cw = shipment.chargeWeight != null ? Number(shipment.chargeWeight) : volSum;
    const dimensionLine = `${l}*${b}*${h}*${piecesTotal}=${Number.isFinite(cw) ? cw.toFixed(3) : "0.000"}`;

    const goodsNames = new Set<string>();
    for (const row of shipment.piecesRows || []) {
        for (const it of row.items || []) {
            const n = it.content?.contentName?.trim();
            if (n) goodsNames.add(n);
        }
    }
    const description = goodsNames.size > 0 ? [...goodsNames].join(", ") : "—";

    const bookFmt = formatDateOnlyDdMmYyyy(shipment.bookDate);

    const declared = Number(shipment.declaredWeight ?? 0);
    const declaredStr = Number.isFinite(declared) ? declared.toFixed(3) : "0.000";

    const valStr =
        shipment.shipmentTotalValue != null && Number.isFinite(Number(shipment.shipmentTotalValue))
            ? `${Number(shipment.shipmentTotalValue)} INR`
            : "—";

    const cell = "border border-black px-1.5 py-0.5 text-black";
    const lbl = "text-[9px] font-bold uppercase leading-tight tracking-tight";
    const val = "text-[11px] font-normal leading-snug break-words min-h-[1.1rem]";

    return (
        <div
            className={cn(
                "overflow-x-auto rounded-sm border-2 border-black bg-white text-black shadow-sm",
                "print:shadow-none print:border-black",
            )}
        >
            <div className="min-w-[520px] p-2 sm:min-w-0 sm:p-3">
                {/* Header */}
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_158px] border border-black">
                    <div className="flex min-h-[78px] items-center justify-center border-r border-black bg-white p-1.5">
                        <div className="flex w-full max-w-[110px] items-center justify-center bg-white px-1 py-0.5">
                            <Image
                                src="/logo/logo.png"
                                alt="SB Express Cargo Courier & Logistics"
                                width={220}
                                height={72}
                                className="h-[52px] w-full bg-white object-contain object-center"
                                style={{ backgroundColor: "#ffffff" }}
                                priority
                            />
                        </div>
                    </div>
                    <div className="flex min-h-[78px] flex-col items-center justify-center border-r border-black px-2 py-2 text-center">
                        {OFFICE_LINES.map((line) => (
                            <div key={line} className="text-[10px] font-bold leading-tight">
                                {line}
                            </div>
                        ))}
                    </div>
                    <div className="flex min-h-[78px] min-w-0 flex-col items-center justify-center px-1 py-1 text-center">
                        <div className="text-[8px] font-medium text-neutral-500">
                            AWB barcode on downloaded PDF
                        </div>
                    </div>
                </div>

                {/* ACCOUNT row — wider CUSTOMER column; row grows for long names */}
                <div className="grid auto-rows-min grid-cols-[minmax(0,14%)_minmax(0,38%)_minmax(0,24%)_minmax(0,24%)] border border-t-0 border-black">
                    {(
                        [
                            ["ACCOUNT:", fb(shipment.customer?.code)],
                            ["CUSTOMER:", fb(shipment.customer?.name)],
                            ["ORIGIN:", originCity],
                            ["DESTINATION:", destCity],
                        ] as const
                    ).map(([label, value]) => (
                        <div
                            key={label}
                            className={cn(
                                cell,
                                "flex min-h-[2.75rem] min-w-0 flex-col justify-start border-r border-black py-1 last:border-r-0",
                            )}
                        >
                            <div className={lbl}>{label}</div>
                            <div className={val}>{value || "—"}</div>
                        </div>
                    ))}
                </div>

                {/* Shipper | Consignee | SB */}
                <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_102px] items-stretch border border-t-0 border-black">
                    <PartyColumn
                        title="SENDER'S"
                        company={fb(shipper?.shipperName || shipper?.name)}
                        name={fb(shipper?.contactPerson)}
                        a1={fb(shipper?.address1)}
                        a2={fb(shipper?.address2)}
                        pin={fb(shipper?.serviceablePincode?.pinCode)}
                        city={fb(shipper?.serviceablePincode?.cityName)}
                        tel={fb(shipper?.telephone ?? shipper?.mobile)}
                        state={stateFrom(shipper)}
                        mob={fb(shipper?.mobile)}
                        country={countryFrom(shipper)}
                        cell={cell}
                        lbl={lbl}
                        val={val}
                    />
                    <PartyColumn
                        title="RECIPIENT'S"
                        company={fb(consignee?.name || consignee?.consigneeName)}
                        name={fb(consignee?.contactPerson)}
                        a1={fb(consignee?.address1)}
                        a2={fb(consignee?.address2)}
                        pin={fb(consignee?.serviceablePincode?.pinCode)}
                        city={fb(consignee?.serviceablePincode?.cityName)}
                        tel={fb(consignee?.telephone ?? consignee?.mobile)}
                        state={stateFrom(consignee)}
                        mob={fb(consignee?.mobile)}
                        country={countryFrom(consignee)}
                        cell={cell}
                        lbl={lbl}
                        val={val}
                        borderLeft
                    />
                    <div className="flex min-h-0 min-w-0 flex-col border-l border-black">
                        <div className={cn(cell, "border-b border-black text-center")}>
                            <div className="text-[10px] font-bold">SB EXPRESS</div>
                        </div>
                        <div className={cn(cell, "shrink-0 border-b border-black")}>
                            <div className={lbl}>ACTUAL WEIGHT:</div>
                            <div className="text-center text-sm font-bold">{declaredStr}</div>
                        </div>
                        <div className={cn(cell, "flex min-h-[4rem] flex-1 flex-col")}>
                            <div className={lbl}>DIMENSION IN CM:</div>
                            <div className="flex min-h-0 flex-1 items-center justify-center px-0.5 py-1 text-center text-[10px] leading-tight break-words">
                                {dimensionLine}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cn(cell, "border border-t-0 border-black")}>
                    <div className={lbl}>REFERENCE NUMBER:</div>
                    <div
                        className={cn(
                            val,
                            "max-h-[2.1em] overflow-hidden py-0.5 leading-tight break-all line-clamp-2",
                        )}
                    >
                        {formatDrsReferenceNo(shipment.referenceNo) || "—"}
                    </div>
                </div>

                {/* Goods / pieces — compact row height */}
                <div className="grid auto-rows-min grid-cols-[28%_22%_14%_18%_18%] items-stretch border border-t-0 border-black">
                    <div className={cn(cell, "flex min-h-0 min-w-0 flex-col border-r border-black py-0.5")}>
                        <div className={lbl}>DESCRIPTION OF GOODS:</div>
                        <div className={cn(val, "min-h-0 flex-1 leading-tight")}>{description}</div>
                    </div>
                    <div className={cn(cell, "flex min-h-0 min-w-0 flex-col border-r border-black py-0.5")}>
                        <div className={lbl}>PIECES:</div>
                        <div className="flex min-h-[1.75rem] flex-1 items-center justify-center text-base font-bold">
                            {piecesTotal}
                        </div>
                    </div>
                    <div className={cn(cell, "flex min-h-0 min-w-0 flex-col border-r border-black py-0.5")}>
                        <div className={lbl}>MODE:</div>
                        <div className="mt-1 flex flex-1 items-center justify-center text-center text-[11px] font-bold">
                            {(shipment.product?.productName || shipment.product?.name || "SURFACE").toUpperCase()}
                        </div>
                    </div>
                    <div className={cn(cell, "border-r border-black p-0")}>
                        <div className="bg-black px-1.5 py-0.5 text-center text-[9px] font-bold text-white">SHIPMENT VALUE</div>
                        <div className="px-1.5 py-1 text-[11px]">Value: {valStr}</div>
                    </div>
                    <div className={cn(cell, "p-0")}>
                        <div className="bg-black px-1.5 py-0.5 text-center text-[9px] font-bold text-white">BOOKING DATE</div>
                        <div className="px-1.5 py-1 text-[11px]">Date: {bookFmt}</div>
                    </div>
                </div>

                {/* GST / Invoice / E-way — single row, equal columns */}
                <div className="grid grid-cols-3 border border-t-0 border-black text-[10px]">
                    <div className={cn(cell, "border-r border-black py-1")}>
                        <span className="font-bold">GSTIN:</span>{" "}
                        <span className="font-normal">{fb(shipment.customer?.gstNo) || "—"}</span>
                    </div>
                    <div className={cn(cell, "border-r border-black py-1")}>
                        <span className="font-bold">INVOICE NO:</span>{" "}
                        <span className="font-normal">
                            {[fb(shipment.invoiceNumber), fb(shipment.invoiceDate?.split("T")[0])].filter(Boolean).join(" / ") || "—"}
                        </span>
                    </div>
                    <div className={cn(cell, "py-1")}>
                        <span className="font-bold">EWAY BILL NO:</span>{" "}
                        <span className="font-normal">{fb(shipment.ewaybillNumber) || "—"}</span>
                    </div>
                </div>

                {/* Payment note */}
                <div className={cn(cell, "border border-t-0 border-black whitespace-pre-line text-[10px] font-bold leading-snug")}>
                    {PAYMENT_NOTE}
                </div>

                {/* Bottom: agreement + terms | spacer | billing — row height from content */}
                <div className="grid auto-rows-min grid-cols-[40%_32%_28%] items-stretch border border-t-0 border-black">
                    <div className={cn(cell, "min-w-0 border-r border-black")}>
                        <div className={lbl}>SHIPPER AGREEMENT:</div>
                        <p className="mt-1 text-[10px] leading-snug">{SHIPPER_AGREEMENT}</p>
                        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[9px] leading-snug">
                            {TERMS.map((t, i) => (
                                <li key={i}>{t}</li>
                            ))}
                        </ol>
                        <div className="mt-2 grid grid-cols-2 gap-0 border border-black">
                            <div className={cn(cell, "border-r border-black border-t-0 border-l-0 border-b-0")}>
                                <div className={lbl}>CONSIGNEE SIGNATURE</div>
                            </div>
                            <div className={cn(cell, "border-0")}>
                                <div className={lbl}>DATE</div>
                            </div>
                        </div>
                        <div className="mt-0 border border-t-0 border-black">
                            <div className={cn(cell, "border-0")}>
                                <div className={lbl}>PICK UP</div>
                                <div className="mt-1 flex gap-4 text-[10px] font-bold">
                                    <span>NAME:</span>
                                    <span>SIGN:</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className={cn(
                            cell,
                            "min-h-0 min-w-0 border-r border-black bg-neutral-50/30",
                        )}
                        aria-hidden
                    />
                    <div className={cn(cell, "border-0 p-0")}>
                        <div className="bg-black px-2 py-1.5 text-center text-[10px] font-bold text-white">METHOD OF PAYMENT</div>
                        <div className="px-2 py-1 text-sm font-bold">{formatShipmentPaymentTypeLabel(shipment.paymentType)}</div>
                    </div>
                </div>

                <p className="mt-2 text-center text-[10px] font-bold">*** Subject to Mumbai Jurisdiction ***</p>
                <p className="pb-1 text-center text-xs font-bold">THANK YOU FOR COUNTING ON SB Express Cargo</p>
            </div>
        </div>
    );
}

function PartyColumn({
    title,
    company,
    name,
    a1,
    a2,
    pin,
    city,
    tel,
    state,
    mob,
    country,
    cell,
    lbl,
    val,
    borderLeft,
}: {
    title: string;
    company: string;
    name: string;
    a1: string;
    a2: string;
    pin: string;
    city: string;
    tel: string;
    state: string;
    mob: string;
    country: string;
    cell: string;
    lbl: string;
    val: string;
    borderLeft?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex h-full min-h-0 min-w-0 flex-col",
                borderLeft && "border-l border-black",
            )}
        >
            <div className={cn(cell, "min-w-0 shrink-0 border-b border-black border-t-0 border-l-0 border-r-0")}>
                <div className={lbl}>{title} COMPANY:</div>
                <div className={cn(val, "break-words")}>{company || "—"}</div>
            </div>
            <div className={cn(cell, "min-w-0 shrink-0 border-b border-black border-t-0 border-l-0 border-r-0")}>
                <div className={lbl}>{title} NAME:</div>
                <div className={cn(val, "break-words")}>{name || ""}</div>
            </div>
            <div
                className={cn(
                    cell,
                    "flex min-h-[3rem] min-w-0 flex-1 flex-col border-b border-black border-t-0 border-l-0 border-r-0",
                )}
            >
                <div className={lbl}>ADDRESS:</div>
                <div className={cn(val, "min-h-0 flex-1 whitespace-pre-line break-words")}>
                    {[a1, a2].filter(Boolean).join("\n") || "—"}
                </div>
            </div>
            <div className="grid min-w-0 grid-cols-2 border-b border-black">
                <div className={cn(cell, "min-w-0 border-r border-black border-t-0 border-b-0 border-l-0")}>
                    <div className={lbl}>PIN CODE:</div>
                    <div className={cn(val, "break-all")}>{pin || "—"}</div>
                </div>
                <div className={cn(cell, "min-w-0 border-0")}>
                    <div className={lbl}>CITY:</div>
                    <div className={cn(val, "break-words")}>{city || "—"}</div>
                </div>
            </div>
            <div className="grid min-w-0 grid-cols-2 border-b border-black">
                <div className={cn(cell, "min-w-0 border-r border-black border-t-0 border-b-0 border-l-0")}>
                    <div className={lbl}>TEL NO.:</div>
                    <div className={cn(val, "break-all")}>{tel || "—"}</div>
                </div>
                <div className={cn(cell, "min-w-0 border-0")}>
                    <div className={lbl}>STATE:</div>
                    <div className={cn(val, "break-words")}>{state || "—"}</div>
                </div>
            </div>
            <div className="grid min-w-0 grid-cols-2">
                <div className={cn(cell, "min-w-0 border-r border-black border-t-0 border-b-0 border-l-0")}>
                    <div className={lbl}>MOB.NO.:</div>
                    <div className={cn(val, "break-all")}>{mob || "—"}</div>
                </div>
                <div className={cn(cell, "min-w-0 border-0")}>
                    <div className={lbl}>COUNTRY:</div>
                    <div className={cn(val, "break-words")}>{country}</div>
                </div>
            </div>
        </div>
    );
}
