export interface BaseResource {
  id?: string;
  uniqid?: string;
  [key: string]: unknown;
}

export interface Product extends BaseResource {
  name?: string;
}

export interface Order extends BaseResource {
  status?: string;
}

export interface Customer extends BaseResource {
  email?: string;
}

export interface Payment extends BaseResource {
  status?: string;
}

export interface Invoice extends BaseResource {
  status?: string;
}

export interface Coupon extends BaseResource {
  code?: string;
}

export interface Webhook extends BaseResource {
  url?: string;
}
