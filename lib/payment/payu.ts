import crypto from "crypto";

export interface PayURequestParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  curl?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayUResponsePayload {
  status?: string;
  firstname?: string;
  email?: string;
  productinfo?: string;
  amount?: string;
  txnid?: string;
  key?: string;
  hash?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  additional_charges?: string;
  mihpayid?: string;
  mode?: string;
  bankcode?: string;
  bank_ref_no?: string;
  error?: string;
  error_Message?: string;
  [key: string]: string | undefined;
}

export function getPayUConfig() {
  const payuMode = (process.env.PAYU_MODE || "").toLowerCase();
  const baseUrl =
    process.env.PAYU_BASE_URL ||
    (payuMode === "production" || process.env.NODE_ENV === "production"
      ? "https://secure.payu.in"
      : "https://test.payu.in");

  return {
    merchantKey: process.env.PAYU_MERCHANT_KEY || "",
    merchantSalt: process.env.PAYU_MERCHANT_SALT || "",
    baseUrl,
  };
}

export function generatePayUTxnId() {
  return `TXN${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
}

export function buildPayURequestHashString(
  params: Pick<
    PayURequestParams,
    | "key"
    | "txnid"
    | "amount"
    | "productinfo"
    | "firstname"
    | "email"
    | "udf1"
    | "udf2"
    | "udf3"
    | "udf4"
    | "udf5"
  >,
  salt: string
) {
  return `${params.key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${params.udf1 || ""}|${params.udf2 || ""}|${params.udf3 || ""}|${params.udf4 || ""}|${params.udf5 || ""}||||||${salt}`;
}

export function generatePayURequestHash(
  params: Pick<
    PayURequestParams,
    | "key"
    | "txnid"
    | "amount"
    | "productinfo"
    | "firstname"
    | "email"
    | "udf1"
    | "udf2"
    | "udf3"
    | "udf4"
    | "udf5"
  >,
  salt: string
) {
  const hashString = buildPayURequestHashString(params, salt);
  return crypto.createHash("sha512").update(hashString).digest("hex").toLowerCase();
}

export function verifyPayUResponseHash(
  payload: PayUResponsePayload,
  salt: string
) {
  const {
    status = "",
    firstname = "",
    email = "",
    productinfo = "",
    amount = "",
    txnid = "",
    key = "",
    hash = "",
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
    additional_charges = "",
  } = payload;

  const hashString = additional_charges
    ? `${additional_charges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
    : `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

  const calculatedHash = crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex")
    .toLowerCase();

  return calculatedHash === (hash || "").toLowerCase();
}

export function normalizePayUStatus(status?: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "success") {
    return "success" as const;
  }

  if (normalized === "pending") {
    return "pending" as const;
  }

  if (normalized === "cancel" || normalized === "cancelled") {
    return "cancelled" as const;
  }

  return "failed" as const;
}
